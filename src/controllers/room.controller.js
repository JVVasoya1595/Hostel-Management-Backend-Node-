const service = require('../services/room.service');
const { runParamRequest } = require('./_encryptedActorController');

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
    return runParamRequest({
        req,
        res,
        action: 'Get rooms',
        successMessage: 'Rooms fetched successfully',
        allowedRoles: ['admin', 'manager', 'warden'],
        handler: async () => service.getAllRooms(),
    });
};

exports.getAvailableRooms = async (req, res) => {
    return runParamRequest({
        req,
        res,
        action: 'Get available rooms',
        successMessage: 'Available rooms fetched successfully',
        allowedRoles: ['admin', 'manager', 'warden'],
        handler: async () => service.getAvailableRooms(),
    });
};
