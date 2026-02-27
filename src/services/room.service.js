const Room = require('../models/room.model');
const Bed = require('../models/bed.model');
const Floor = require('../models/floor.model');
const Student = require('../models/student.model');
const notificationService = require('./notification.service');
const { updateFloorStatus } = require('./floor.service');

// Get all rooms
exports.getAllRooms = async () => {
    return await Room.find().populate('floor_id', 'floor_number status').lean();
};

// Get available rooms only
exports.getAvailableRooms = async () => {
    return await Room.find({ status: 'AVAILABLE' })
        .populate('floor_id', 'floor_number')
        .lean();
};

// Create a room manually (validates floor exists + room count ≤ 2)
exports.createRoom = async (floor_id, room_number) => {
    const floor = await Floor.findById(floor_id);
    if (!floor) throw new Error('Floor not found');

    const roomCount = await Room.countDocuments({ floor_id });
    if (roomCount >= 2) throw new Error('Floor already has maximum 2 rooms');

    const room = await Room.create({ room_number, floor_id, total_beds: 2, occupied_beds: 0 });
    for (let b = 1; b <= 2; b++) {
        await Bed.create({ bed_number: `B${b}`, room_id: room._id });
    }
    return room;
};

// Assign student to a bed in a room
exports.assignRoom = async (student_id, room_id) => {
    const room = await Room.findById(room_id).populate('floor_id');
    if (!room) throw new Error('Room not found');

    if (room.status === 'FULL') {
        throw new Error('Room is full. Assign another room.');
    }

    const student = await Student.findById(student_id);
    if (!student) throw new Error('Student not found');
    if (student.status === 'ALLOTTED') throw new Error('Student is already allotted a room');

    // Find a free bed in this room
    const bed = await Bed.findOne({ room_id, is_occupied: false });
    if (!bed) throw new Error('No available bed found in this room');

    // Assign bed
    bed.is_occupied = true;
    bed.student_id = student._id;
    await bed.save();

    // Update room occupancy
    room.occupied_beds += 1;
    if (room.occupied_beds >= room.total_beds) {
        room.status = 'FULL';
    }
    await room.save();

    // Update student
    student.status = 'ALLOTTED';
    student.room_id = room._id;
    student.bed_id = bed._id;
    await student.save();

    // Notify parent
    await notificationService.createNotification(
        student._id,
        room.room_number,
        room.floor_id.floor_number
    );

    // Update floor status
    await updateFloorStatus(room.floor_id._id);

    // Check floor status for message
    const updatedFloor = await Floor.findById(room.floor_id._id);
    const message = updatedFloor.status === 'FULL'
        ? 'Floor is full. Please create a new floor.'
        : 'Student assigned successfully';

    return {
        message,
        student: { id: student._id, name: student.name, status: student.status },
        room: { room_number: room.room_number, status: room.status },
        bed: { bed_number: bed.bed_number },
        floor: { floor_number: updatedFloor.floor_number, status: updatedFloor.status }
    };
};

// Get allotted room info for a student
exports.getStudentRoom = async (student_id) => {
    const student = await Student.findById(student_id)
        .populate({ path: 'room_id', populate: { path: 'floor_id', select: 'floor_number' } })
        .populate('bed_id', 'bed_number');

    if (!student) throw new Error('Student not found');
    if (student.status !== 'ALLOTTED') throw new Error('No room allotted yet');

    return {
        room_number: student.room_id?.room_number,
        floor_number: student.room_id?.floor_id?.floor_number,
        bed_number: student.bed_id?.bed_number,
        student_name: student.name
    };
};
