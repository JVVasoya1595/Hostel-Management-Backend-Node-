const service = require('../services/room.service');

exports.createRoom = async (req, res) => {
    try {
        const { floor_id, room_number } = req.body;
        const room = await service.createRoom(floor_id, room_number);
        res.status(201).json({ message: 'Room created with 2 beds', room });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.getAllRooms = async (req, res) => {
    try {
        const rooms = await service.getAllRooms();
        res.json(rooms);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getAvailableRooms = async (req, res) => {
    try {
        const rooms = await service.getAvailableRooms();
        res.json(rooms);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
