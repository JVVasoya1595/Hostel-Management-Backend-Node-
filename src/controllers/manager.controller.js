const mongoose = require('mongoose');
const service = require('../services/managerAuth.service');
const roomService = require('../services/room.service');

exports.register = async (req, res) => {
    try {
        const user = await service.register(req.body);
        res.json(user);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.login = async (req, res) => {
    try {
        const token = await service.login(req.body.email, req.body.password);
        res.json({ token });
    } catch (err) {
        res.status(401).json({ message: err.message });
    }
};

exports.getProfile = async (req, res) => {
    try {
        const profile = await service.getProfile(req.user.id);
        if (!profile) return res.status(404).json({ message: "Manager not found" });
        res.json(profile);
    } catch (err) {
        res.status(404).json({ message: err.message });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const profile = await service.updateProfile(req.user.id, req.body);
        if (!profile) return res.status(404).json({ message: "Manager not found" });
        res.json(profile);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.getAllStudents = async (req, res) => {
    try {
        const students = await service.getAllStudents();
        res.json(students);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// --- Manager creates users ---
exports.createStudent = async (req, res) => {
    try {
        const user = await service.createStudent(req.body);
        res.status(201).json(user);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.createParent = async (req, res) => {
    try {
        const user = await service.createParent(req.body);
        res.status(201).json(user);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// --- Manager gets user by ID ---
exports.getStudentById = async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id))
        return res.status(400).json({ message: `Invalid ID format: "${req.params.id}". Provide a valid MongoDB ObjectId.` });
    try {
        const user = await service.getStudentById(req.params.id);
        if (!user) return res.status(404).json({ message: "Student not found" });
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.updateStudent = async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id))
        return res.status(400).json({ message: `Invalid ID format: "${req.params.id}". Provide a valid MongoDB ObjectId.` });
    try {
        const user = await service.updateStudent(req.params.id, req.body);
        if (!user) return res.status(404).json({ message: "Student not found" });
        res.json(user);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.getParentById = async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id))
        return res.status(400).json({ message: `Invalid ID format: "${req.params.id}". Provide a valid MongoDB ObjectId.` });
    try {
        const user = await service.getParentById(req.params.id);
        if (!user) return res.status(404).json({ message: "Parent not found" });
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.updateParent = async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id))
        return res.status(400).json({ message: `Invalid ID format: "${req.params.id}". Provide a valid MongoDB ObjectId.` });
    try {
        const user = await service.updateParent(req.params.id, req.body);
        if (!user) return res.status(404).json({ message: "Parent not found" });
        res.json(user);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.assignRoom = async (req, res) => {
    try {
        const { student_id, room_id } = req.body;
        if (!student_id || !room_id) return res.status(400).json({ message: 'student_id and room_id are required' });
        const result = await roomService.assignRoom(student_id, room_id);
        res.json(result);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.getAvailableRooms = async (req, res) => {
    try {
        const rooms = await roomService.getAvailableRooms();
        res.json(rooms);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
