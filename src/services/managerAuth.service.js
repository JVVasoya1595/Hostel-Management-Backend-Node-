const Manager = require('../models/manager.model');
const Student = require('../models/student.model');
const Parent = require('../models/parent.model');
const { encrypt, decrypt } = require('../utils/encryption/manager.encrypt');
const { encrypt: encryptStudent } = require('../utils/encryption/student.encrypt');
const { encrypt: encryptParent } = require('../utils/encryption/parent.encrypt');
const jwt = require('jsonwebtoken');

exports.register = async (data) => {
    const encryptedPassword = encrypt(data.password);
    return await Manager.create({ ...data, encryptedPassword });
};

exports.login = async (email, password) => {
    const manager = await Manager.findOne({ email });
    if (!manager) throw new Error("Manager not found");

    const decrypted = decrypt(manager.encryptedPassword);
    if (decrypted !== password) throw new Error("Invalid password");

    return jwt.sign({ id: manager._id, role: manager.role }, process.env.JWT_SECRET);
};

exports.getProfile = async (id) => {
    return await Manager.findById(id).select('-encryptedPassword');
};

exports.updateProfile = async (id, data) => {
    if (data.password) {
        data.encryptedPassword = encrypt(data.password);
        delete data.password;
    }
    return await Manager.findByIdAndUpdate(id, data, { new: true }).select('-encryptedPassword');
};

exports.getAllStudents = async () => {
    return await Student.find().select('-encryptedPassword');
};

// --- Manager creates users ---
exports.createStudent = async (data) => {
    const existingStudent = await Student.findOne({ email: data.email });
    if (existingStudent) {
        throw new Error("Student already exists. Access denied to change credentials.");
    }
    const { password, ...rest } = data;
    const encryptedPassword = encryptStudent(password);
    return await Student.create({ ...rest, encryptedPassword });
};

exports.createParent = async (data) => {
    const existingParent = await Parent.findOne({ email: data.email });
    if (existingParent) {
        throw new Error("Parent already exists. Access denied to change credentials.");
    }
    const { password, ...rest } = data;
    const encryptedPassword = await encryptParent(password);
    return await Parent.create({ ...rest, encryptedPassword });
};

// --- Manager gets user by ID ---
exports.getStudentById = async (id) => {
    return await Student.findById(id).select('-encryptedPassword');
};

exports.updateStudent = async (id, data) => {
    if (data.email || data.password) {
        throw new Error("Manager does not have access to change student credentials (email/password).");
    }
    return await Student.findByIdAndUpdate(id, data, { new: true }).select('-encryptedPassword');
};

exports.getParentById = async (id) => {
    return await Parent.findById(id).select('-encryptedPassword');
};

exports.updateParent = async (id, data) => {
    if (data.email || data.password) {
        throw new Error("Manager does not have access to change parent credentials (email/password).");
    }
    return await Parent.findByIdAndUpdate(id, data, { new: true }).select('-encryptedPassword');
};
