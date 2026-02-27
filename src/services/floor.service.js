const Floor = require('../models/floor.model');
const Room = require('../models/room.model');
const Bed = require('../models/bed.model');
const Student = require('../models/student.model');

// Create floor + auto-create 2 rooms + 2 beds each
exports.createFloor = async (floor_number) => {
    const existing = await Floor.findOne({ floor_number });
    if (existing) throw new Error(`Floor ${floor_number} already exists`);

    const floor = await Floor.create({ floor_number, total_capacity: 4 });

    for (let r = 1; r <= 2; r++) {
        const room = await Room.create({
            room_number: `${floor_number}0${r}`,
            floor_id : floor._id,
            total_beds: 2,
            occupied_beds: 0
        });
        for (let b = 1; b <= 2; b++) {
            await Bed.create({
                bed_number: `B${b}`,
                room_id: room._id
            });
        }
    }

    return floor;
};

// Get all floors with room / bed stats
exports.getAllFloors = async () => {
    const floors = await Floor.find().lean();
    const result = [];

    for (const floor of floors) {
        const rooms = await Room.find({ floor_id: floor._id }).lean();
        let totalBeds = 0, occupiedBeds = 0;
        for (const room of rooms) {
            totalBeds += room.total_beds;
            occupiedBeds += room.occupied_beds;
        }
        result.push({
            ...floor,
            total_rooms: rooms.length,
            total_beds: totalBeds,
            occupied_beds: occupiedBeds
        });
    }
    return result;
};

// Update floor (allow room increase if not full; recalculate capacity)
exports.updateFloor = async (id, data) => {
    const floor = await Floor.findById(id);
    if (!floor) throw new Error('Floor not found');
    if (floor.status === 'FULL') throw new Error('Floor is full. Cannot update a full floor.');

    // If admin wants to add a room
    if (data.addRoom) {
        const roomCount = await Room.countDocuments({ floor_id: id });
        const newRoomNumber = `${floor.floor_number}0${roomCount + 1}`;
        const room = await Room.create({
            room_number: newRoomNumber,
            floor_id: floor._id,
            total_beds: 2,
            occupied_beds: 0
        });
        for (let b = 1; b <= 2; b++) {
            await Bed.create({ bed_number: `B${b}`, room_id: room._id });
        }
        floor.total_capacity = (roomCount + 1) * 2;
        await floor.save();
        return floor;
    }

    Object.assign(floor, data);
    return await floor.save();
};

// Delete floor only if no occupied beds and no assigned students
exports.deleteFloor = async (id) => {
    const floor = await Floor.findById(id);
    if (!floor) throw new Error('Floor not found');

    const rooms = await Room.find({ floor_id: id });
    for (const room of rooms) {
        if (room.occupied_beds > 0) throw new Error('Cannot delete: floor has occupied beds');
    }

    const assigned = await Student.findOne({ room_id: { $in: rooms.map(r => r._id) } });
    if (assigned) throw new Error('Cannot delete: students are assigned to this floor');

    // Delete beds, rooms, then floor
    for (const room of rooms) {
        await Bed.deleteMany({ room_id: room._id });
    }
    await Room.deleteMany({ floor_id: id });
    await Floor.findByIdAndDelete(id);

    return { message: 'Floor deleted successfully' };
};

// Auto-update floor status if all rooms are FULL
exports.updateFloorStatus = async (floor_id) => {
    const rooms = await Room.find({ floor_id });
    if (rooms.length === 0) return;
    const allFull = rooms.every(r => r.status === 'FULL');
    await Floor.findByIdAndUpdate(floor_id, { status: allFull ? 'FULL' : 'AVAILABLE' });
};
