const mongoose = require('mongoose');
const service = require('../services/floor.service');

exports.createFloor = async (req, res) => {
    const { floor_number } = req.body;
    if (floor_number === undefined || floor_number === null)
        return res.status(400).json({ message: 'floor_number is required' });
    try {
        const floor = await service.createFloor(floor_number);
        res.status(201).json({ message: 'Floor created with 2 rooms and 4 beds', floor });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.getAllFloors = async (req, res) => {
    try {
        const floors = await service.getAllFloors();
        res.json(floors);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.updateFloor = async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id))
        return res.status(400).json({ message: `Invalid ID format: "${req.params.id}". Provide a valid MongoDB ObjectId.` });
    try {
        const floor = await service.updateFloor(req.params.id, req.body);
        res.json({ message: 'Floor updated', floor });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.deleteFloor = async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id))
        return res.status(400).json({ message: `Invalid ID format: "${req.params.id}". Provide a valid MongoDB ObjectId.` });
    try {
        const result = await service.deleteFloor(req.params.id);
        res.json(result);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};
