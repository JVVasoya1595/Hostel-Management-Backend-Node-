const service = require('../services/floor.service');

exports.createFloor = async (req, res) => {
    try {
        const floor = await service.createFloor(req.body.floor_number);
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
    try {
        const floor = await service.updateFloor(req.params.id, req.body);
        res.json({ message: 'Floor updated', floor });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.deleteFloor = async (req, res) => {
    try {
        const result = await service.deleteFloor(req.params.id);
        res.json(result);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};
