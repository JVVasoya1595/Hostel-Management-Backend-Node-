const Room = require('../models/room.model');
const Bed = require('../models/bed.model');
const Floor = require('../models/floor.model');
const Student = require('../models/student.model');
const Manager = require('../models/manager.model');
const Parent = require('../models/parent.model');
const notificationService = require('./notification.service');
const { updateFloorStatus, recalculateFloorCapacity } = require('./floor.service');

const parsePositiveInteger = (value, label) => {
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed <= 0) {
        throw new Error(`${label} must be a positive integer`);
    }

    return parsed;
};

const createBeds = async (roomId, startingIndex, totalBeds) => {
    if (totalBeds <= 0) {
        return;
    }

    const bedDocuments = Array.from({ length: totalBeds }, (_, index) => ({
        bed_number: `B${startingIndex + index}`,
        room_id: roomId,
    }));

    await Bed.insertMany(bedDocuments);
};

const getAllRooms = async () => {
    const rooms = await Room.find()
        .populate('floor_id', 'floor_number status')
        .sort({ room_number: 1 })
        .lean();

    return rooms.map((room) => ({
        ...room,
        available_beds: room.total_beds - room.occupied_beds,
    }));
};

const getAvailableRooms = async () => {
    const rooms = await Room.find({ status: 'AVAILABLE' })
        .populate('floor_id', 'floor_number status')
        .sort({ room_number: 1 })
        .lean();

    return rooms.map((room) => ({
        ...room,
        available_beds: room.total_beds - room.occupied_beds,
    }));
};

const createRoom = async (floor_id, room_number, total_beds = 2) => {
    const floor = await Floor.findById(floor_id);
    if (!floor) {
        throw new Error('Floor not found');
    }

    const normalizedTotalBeds = parsePositiveInteger(total_beds, 'total_beds');
    const normalizedRoomNumber = String(room_number || '').trim();
    if (!normalizedRoomNumber) {
        throw new Error('room_number is required');
    }

    const existingRoom = await Room.findOne({ room_number: normalizedRoomNumber });
    if (existingRoom) {
        throw new Error(`Room ${normalizedRoomNumber} already exists`);
    }

    const room = await Room.create({
        floor_id,
        room_number: normalizedRoomNumber,
        total_beds: normalizedTotalBeds,
        occupied_beds: 0,
        status: 'AVAILABLE',
    });

    await createBeds(room._id, 1, normalizedTotalBeds);
    await recalculateFloorCapacity(floor._id);
    await updateFloorStatus(floor._id);

    return Room.findById(room._id).populate('floor_id', 'floor_number status');
};

const updateRoom = async (room_id, data) => {
    const room = await Room.findById(room_id);
    if (!room) {
        throw new Error('Room not found');
    }

    if (data.room_number !== undefined) {
        const normalizedRoomNumber = String(data.room_number || '').trim();
        if (!normalizedRoomNumber) {
            throw new Error('room_number cannot be empty');
        }

        const duplicateRoom = await Room.findOne({
            room_number: normalizedRoomNumber,
            _id: { $ne: room._id },
        });

        if (duplicateRoom) {
            throw new Error(`Room ${normalizedRoomNumber} already exists`);
        }

        room.room_number = normalizedRoomNumber;
    }

    if (data.total_beds !== undefined) {
        const nextTotalBeds = parsePositiveInteger(data.total_beds, 'total_beds');
        if (nextTotalBeds < room.occupied_beds) {
            throw new Error('Cannot reduce total_beds below occupied_beds');
        }

        if (nextTotalBeds > room.total_beds) {
            await createBeds(room._id, room.total_beds + 1, nextTotalBeds - room.total_beds);
        } else if (nextTotalBeds < room.total_beds) {
            const removableBeds = await Bed.find({ room_id: room._id, is_occupied: false });
            removableBeds.sort((left, right) => {
                const leftNumber = Number(String(left.bed_number).replace('B', ''));
                const rightNumber = Number(String(right.bed_number).replace('B', ''));
                return rightNumber - leftNumber;
            });

            const bedsToDelete = removableBeds.slice(0, room.total_beds - nextTotalBeds);
            if (bedsToDelete.length !== room.total_beds - nextTotalBeds) {
                throw new Error('Not enough free beds to reduce room capacity');
            }

            await Bed.deleteMany({ _id: { $in: bedsToDelete.map((bed) => bed._id) } });
        }

        room.total_beds = nextTotalBeds;
    }

    room.status = room.occupied_beds >= room.total_beds ? 'FULL' : 'AVAILABLE';
    await room.save();

    await recalculateFloorCapacity(room.floor_id);
    await updateFloorStatus(room.floor_id);

    return Room.findById(room._id).populate('floor_id', 'floor_number status');
};

const deleteRoom = async (room_id) => {
    const room = await Room.findById(room_id);
    if (!room) {
        throw new Error('Room not found');
    }

    if (room.occupied_beds > 0) {
        throw new Error('Cannot delete room with occupied beds');
    }

    const assignedStudent = await Student.findOne({ room_id: room._id });
    if (assignedStudent) {
        throw new Error('Cannot delete room while students are still assigned');
    }

    await Bed.deleteMany({ room_id: room._id });
    await room.deleteOne();

    await recalculateFloorCapacity(room.floor_id);
    await updateFloorStatus(room.floor_id);

    return { message: 'Room deleted successfully' };
};

const assignRoom = async (student_id, room_id) => {
    const room = await Room.findById(room_id).populate('floor_id');
    if (!room) {
        throw new Error('Room not found');
    }

    if (room.status === 'FULL' || room.occupied_beds >= room.total_beds) {
        throw new Error('Room is full. Assign another room.');
    }

    const student = await Student.findById(student_id);
    if (!student) {
        throw new Error('Student not found');
    }

    if (student.status === 'ALLOTTED' || student.room_id || student.bed_id) {
        throw new Error('Student is already allotted a room');
    }

    const bed = await Bed.findOne({ room_id, is_occupied: false }).sort({ createdAt: 1 });
    if (!bed) {
        throw new Error('No available bed found in this room');
    }

    bed.is_occupied = true;
    bed.student_id = student._id;
    await bed.save();

    room.occupied_beds += 1;
    room.status = room.occupied_beds >= room.total_beds ? 'FULL' : 'AVAILABLE';
    await room.save();

    student.status = 'ALLOTTED';
    student.room_id = room._id;
    student.bed_id = bed._id;
    await student.save();

    await notificationService.createNotification(
        student._id,
        room.room_number,
        room.floor_id.floor_number
    );

    await updateFloorStatus(room.floor_id._id);

    const updatedFloor = await Floor.findById(room.floor_id._id);
    return {
        message: updatedFloor.status === 'FULL'
            ? 'Student assigned successfully. Floor is now full.'
            : 'Student assigned successfully',
        student: { id: student._id, name: student.name, status: student.status },
        room: { id: room._id, room_number: room.room_number, status: room.status },
        bed: { id: bed._id, bed_number: bed.bed_number },
        floor: { id: updatedFloor._id, floor_number: updatedFloor.floor_number, status: updatedFloor.status },
    };
};

const unassignRoom = async (student_id) => {
    const student = await Student.findById(student_id);
    if (!student) {
        throw new Error('Student not found');
    }

    if (student.status !== 'ALLOTTED' || !student.room_id || !student.bed_id) {
        throw new Error('Student is not currently allotted any room');
    }

    const bed = await Bed.findById(student.bed_id);
    const room = await Room.findById(student.room_id).populate('floor_id');

    if (bed) {
        bed.is_occupied = false;
        bed.student_id = null;
        await bed.save();
    }

    if (room) {
        room.occupied_beds = Math.max(0, room.occupied_beds - 1);
        room.status = room.occupied_beds >= room.total_beds ? 'FULL' : 'AVAILABLE';
        await room.save();
        await updateFloorStatus(room.floor_id._id);
    }

    student.status = 'PENDING';
    student.room_id = null;
    student.bed_id = null;
    await student.save();

    return {
        message: 'Student unassigned successfully',
        student: { id: student._id, name: student.name, status: student.status },
    };
};

const getStudentRoom = async (student_id) => {
    const student = await Student.findById(student_id)
        .populate({ path: 'room_id', populate: { path: 'floor_id', select: 'floor_number status' } })
        .populate('bed_id', 'bed_number is_occupied');

    if (!student) {
        throw new Error('Student not found');
    }

    if (student.status !== 'ALLOTTED') {
        throw new Error('No room allotted yet');
    }

    const room = student.room_id;
    const floor = room?.floor_id;

    return {
        student: {
            id: student._id,
            name: student.name,
            email: student.email,
            phone: student.phone || null,
            status: student.status,
        },
        room: {
            id: room?._id,
            room_number: room?.room_number,
            status: room?.status,
            total_beds: room?.total_beds,
            occupied_beds: room?.occupied_beds,
        },
        bed: {
            id: student.bed_id?._id,
            bed_number: student.bed_id?.bed_number,
        },
        floor: {
            id: floor?._id,
            floor_number: floor?.floor_number,
            status: floor?.status,
        },
    };
};

const getDashboardStats = async () => {
    const [
        totalStudents,
        allottedStudents,
        pendingStudents,
        totalManagers,
        totalParents,
        totalFloors,
        fullFloors,
        totalRooms,
        fullRooms,
        availableRooms,
        totalBeds,
        occupiedBeds,
    ] = await Promise.all([
        Student.countDocuments(),
        Student.countDocuments({ status: 'ALLOTTED' }),
        Student.countDocuments({ status: 'PENDING' }),
        Manager.countDocuments(),
        Parent.countDocuments(),
        Floor.countDocuments(),
        Floor.countDocuments({ status: 'FULL' }),
        Room.countDocuments(),
        Room.countDocuments({ status: 'FULL' }),
        Room.countDocuments({ status: 'AVAILABLE' }),
        Bed.countDocuments(),
        Bed.countDocuments({ is_occupied: true }),
    ]);

    return {
        students: { total: totalStudents, allotted: allottedStudents, pending: pendingStudents },
        managers: { total: totalManagers },
        parents: { total: totalParents },
        floors: { total: totalFloors, full: fullFloors, available: totalFloors - fullFloors },
        rooms: { total: totalRooms, full: fullRooms, available: availableRooms },
        beds: { total: totalBeds, occupied: occupiedBeds, free: totalBeds - occupiedBeds },
    };
};

module.exports = {
    getAllRooms,
    getAvailableRooms,
    createRoom,
    updateRoom,
    deleteRoom,
    assignRoom,
    unassignRoom,
    getStudentRoom,
    getDashboardStats,
};
