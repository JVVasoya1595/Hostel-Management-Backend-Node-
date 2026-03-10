const Admin = require('../models/admin.model');
const Student = require('../models/student.model');
const Manager = require('../models/manager.model');
const Parent = require('../models/parent.model');
const { encryptData, decryptData } = require('../utils/encryption/admin.encrypt');
const { encryptData: encryptManagerData } = require('../utils/encryption/manager.encrypt');
const { encryptData: encryptStudentData } = require('../utils/encryption/student.encrypt');
const { encryptData: encryptParentData } = require('../utils/encryption/parent.encrypt');
const jwt = require('jsonwebtoken');

exports.register = async (data) => {
    const existing = await Admin.findOne({ email: data.email });
    if (existing) throw new Error('An admin with this email already exists');
    const { password, ...rest } = data;
    const encryptedPassword = encryptData({ password });
    return await Admin.create({ ...rest, encryptedPassword });
};

exports.login = async (email, password) => {
    const admin = await Admin.findOne({ email });
    if (!admin) throw new Error("Admin not found");

    const decrypted = decryptData(admin.encryptedPassword);
    if (decrypted.password !== password) throw new Error("Invalid password");

    return jwt.sign({ id: admin._id, role: admin.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

exports.getProfile = async (id) => {
    return await Admin.findById(id).select('-encryptedPassword');
};

exports.getAllStudents = async () => {
    return await Student.find().select('-encryptedPassword');
};

exports.getAllManagers = async () => {
    return await Manager.find().select('-encryptedPassword');
};

exports.getAllParents = async () => {
    return await Parent.find().select('-encryptedPassword');
};

// --- Admin creates users ---
exports.createManager = async (data) => {
    const existing = await Manager.findOne({ email: data.email });
    if (existing) throw new Error('A manager with this email already exists');
    const { password, ...rest } = data;
    const encryptedPassword = encryptManagerData({ password });
    return await Manager.create({ ...rest, encryptedPassword });
};

exports.createStudent = async (data) => {
    const existing = await Student.findOne({ email: data.email });
    if (existing) throw new Error('A student with this email already exists');
    const { password, ...rest } = data;
    const encryptedPassword = encryptStudentData({ password });
    return await Student.create({ ...rest, encryptedPassword });
};

exports.createParent = async (data) => {
    const existing = await Parent.findOne({ email: data.email });
    if (existing) throw new Error('A parent with this email already exists');
    const { password, ...rest } = data;
    const encryptedPassword = encryptParentData({ password });
    return await Parent.create({ ...rest, encryptedPassword });
};

// --- Admin gets user by ID ---
exports.getManagerById = async (id) => {
    return await Manager.findById(id).select('-encryptedPassword');
};

exports.updateManager = async (id, data) => {
    if (data.password) {
        data.encryptedPassword = encryptManagerData({ password: data.password });
        delete data.password;
    }
    return await Manager.findByIdAndUpdate(id, data, { new: true }).select('-encryptedPassword');
};

exports.getStudentById = async (id) => {
    return await Student.findById(id).select('-encryptedPassword');
};

exports.updateStudent = async (id, data) => {
    if (data.password) {
        data.encryptedPassword = encryptStudentData({ password: data.password });
        delete data.password;
    }
    return await Student.findByIdAndUpdate(id, data, { new: true }).select('-encryptedPassword');
};

exports.getParentById = async (id) => {
    return await Parent.findById(id).select('-encryptedPassword');
};