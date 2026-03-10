const Floor = require('../models/floor.model');
const Room = require('../models/room.model');
const Bed = require('../models/bed.model');
const Student = require('../models/student.model');

const parseInteger = (value, label) => {
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed < 0) {
        throw new Error(`${label} must be a non-negative integer`);
    }

    return parsed;
};

const buildRoomNumber = (floorNumber, roomIndex) => `${floorNumber}${String(roomIndex).padStart(2, '0')}`;

const createBedsForRoom = async (roomId, totalBeds) => {
    if (totalBeds <= 0) {
        return;
    }

    const bedDocuments = Array.from({ length: totalBeds }, (_, index) => ({
        bed_number: `B${index + 1}`,
        room_id: roomId,
    }));

    await Bed.insertMany(bedDocuments);
};

const recalculateFloorCapacity = async (floorId) => {
    const rooms = await Room.find({ floor_id: floorId }).select('total_beds');
    const totalCapacity = rooms.reduce((sum, room) => sum + room.total_beds, 0);

    return Floor.findByIdAndUpdate(
        floorId,
        { total_capacity: totalCapacity },
        { new: true }
    );
};

const updateFloorStatus = async (floorId) => {
    const rooms = await Room.find({ floor_id: floorId }).select('status');
    const status = rooms.length > 0 && rooms.every((room) => room.status === 'FULL')
        ? 'FULL'
        : 'AVAILABLE';

    return Floor.findByIdAndUpdate(
        floorId,
        { status },
        { new: true }
    );
};

const createFloor = async (floor_number, options = {}) => {
    const normalizedFloorNumber = parseInteger(floor_number, 'floor_number');
    if (normalizedFloorNumber === 0) {
        throw new Error('floor_number must be greater than 0');
    }

    const existingFloor = await Floor.findOne({ floor_number: normalizedFloorNumber });
    if (existingFloor) {
        throw new Error(`Floor ${normalizedFloorNumber} already exists`);
    }

    const roomCount = options.room_count === undefined ? 0 : parseInteger(options.room_count, 'room_count');
    const bedsPerRoom = options.beds_per_room === undefined ? 2 : parseInteger(options.beds_per_room, 'beds_per_room');
    if (bedsPerRoom === 0) {
        throw new Error('beds_per_room must be greater than 0');
    }

    const floor = await Floor.create({
        floor_number: normalizedFloorNumber,
        total_capacity: 0,
        status: 'AVAILABLE',
    });

    for (let roomIndex = 1; roomIndex <= roomCount; roomIndex += 1) {
        const room = await Room.create({
            room_number: buildRoomNumber(normalizedFloorNumber, roomIndex),
            floor_id: floor._id,
            total_beds: bedsPerRoom,
            occupied_beds: 0,
            status: 'AVAILABLE',
        });

        await createBedsForRoom(room._id, bedsPerRoom);
    }

    await recalculateFloorCapacity(floor._id);
    await updateFloorStatus(floor._id);

    return Floor.findById(floor._id);
};

const getAllFloors = async () => {
    const floors = await Floor.find().sort({ floor_number: 1 }).lean();

    return Promise.all(floors.map(async (floor) => {
        const rooms = await Room.find({ floor_id: floor._id }).sort({ room_number: 1 }).lean();
        const totalBeds = rooms.reduce((sum, room) => sum + room.total_beds, 0);
        const occupiedBeds = rooms.reduce((sum, room) => sum + room.occupied_beds, 0);

        return {
            ...floor,
            total_rooms: rooms.length,
            total_beds: totalBeds,
            occupied_beds: occupiedBeds,
            available_beds: totalBeds - occupiedBeds,
        };
    }));
};

const updateFloor = async (id, data) => {
    const floor = await Floor.findById(id);
    if (!floor) {
        throw new Error('Floor not found');
    }

    if (data.floor_number !== undefined) {
        const nextFloorNumber = parseInteger(data.floor_number, 'floor_number');
        if (nextFloorNumber === 0) {
            throw new Error('floor_number must be greater than 0');
        }

        const duplicateFloor = await Floor.findOne({
            floor_number: nextFloorNumber,
            _id: { $ne: floor._id },
        });

        if (duplicateFloor) {
            throw new Error(`Floor ${nextFloorNumber} already exists`);
        }

        floor.floor_number = nextFloorNumber;
    }

    if (data.status) {
        floor.status = data.status;
    }

    await floor.save();
    return floor;
};

const deleteFloor = async (id) => {
    const floor = await Floor.findById(id);
    if (!floor) {
        throw new Error('Floor not found');
    }

    const rooms = await Room.find({ floor_id: id });
    for (const room of rooms) {
        if (room.occupied_beds > 0) {
            throw new Error('Cannot delete: floor has occupied beds');
        }
    }

    const assignedStudent = await Student.findOne({
        room_id: { $in: rooms.map((room) => room._id) },
    });
    if (assignedStudent) {
        throw new Error('Cannot delete: students are assigned to this floor');
    }

    for (const room of rooms) {
        await Bed.deleteMany({ room_id: room._id });
    }

    await Room.deleteMany({ floor_id: id });
    await Floor.findByIdAndDelete(id);

    return { message: 'Floor deleted successfully' };
};

module.exports = {
    createFloor,
    getAllFloors,
    updateFloor,
    deleteFloor,
    recalculateFloorCapacity,
    updateFloorStatus,
};
