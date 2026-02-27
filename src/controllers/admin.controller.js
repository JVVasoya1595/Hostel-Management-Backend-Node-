const mongoose = require('mongoose');
const service = require('../services/adminAuth.service');

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
        console.log(token);
        res.json({ token });
    } catch (err) {
        res.status(401).json({ message: err.message });
    }
};

exports.getProfile = async (req, res) => {
    try {
        const profile = await service.getProfile(req.user.id);
        if (!profile) return res.status(404).json({ message: "Admin not found" });
        res.json(profile);
    } catch (err) {
        res.status(404).json({ message: err.message });
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

exports.getAllManagers = async (req, res) => {
    try {
        const managers = await service.getAllManagers();
        res.json(managers);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getAllParents = async (req, res) => {
    try {
        const parents = await service.getAllParents();
        res.json(parents);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// --- Admin creates users ---
exports.createManager = async (req, res) => {
    try {
        const user = await service.createManager(req.body);
        res.status(201).json(user);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

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

// --- Admin gets user by ID ---
exports.getManagerById = async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id))
        return res.status(400).json({ message: `Invalid ID format: "${req.params.id}". Provide a valid MongoDB ObjectId.` });
    try {
        const user = await service.getManagerById(req.params.id);
        if (!user) return res.status(404).json({ message: "Manager not found" });
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.updateManager = async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id))
        return res.status(400).json({ message: `Invalid ID format: "${req.params.id}". Provide a valid MongoDB ObjectId.` });
    try {
        const user = await service.updateManager(req.params.id, req.body);
        if (!user) return res.status(404).json({ message: "Manager not found" });
        res.json(user);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

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
