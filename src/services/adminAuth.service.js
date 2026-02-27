const Admin = require('../models/admin.model');
const Student = require('../models/student.model');
const Manager = require('../models/manager.model');
const Parent = require('../models/parent.model');
const { encrypt, decrypt } = require('../utils/encryption/admin.encrypt');
const { encrypt: encryptManager } = require('../utils/encryption/manager.encrypt');
const { encrypt: encryptStudent } = require('../utils/encryption/student.encrypt');
const { encrypt: encryptParent } = require('../utils/encryption/parent.encrypt');
const jwt = require('jsonwebtoken');

exports.register = async (data) => {
    const encryptedPassword = encrypt(data.password);
    return await Admin.create({ ...data, encryptedPassword });
};

exports.login = async (email, password) => {
    const admin = await Admin.findOne({ email });
    if (!admin) throw new Error("Admin not found");

    const decrypted = decrypt(admin.encryptedPassword);
    if (decrypted !== password) throw new Error("Invalid password");

    return jwt.sign({ id: admin._id, role: admin.role }, process.env.JWT_SECRET);
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
    const { password, ...rest } = data;
    const encryptedPassword = encryptManager(password);
    return await Manager.create({ ...rest, encryptedPassword });
};

exports.createStudent = async (data) => {
    const { password, ...rest } = data;
    const encryptedPassword = encryptStudent(password);
    return await Student.create({ ...rest, encryptedPassword });
};

exports.createParent = async (data) => {
    const { password, ...rest } = data;
    const encryptedPassword = await encryptParent(password); // bcrypt is async
    return await Parent.create({ ...rest, encryptedPassword });
};

// --- Admin gets user by ID ---
exports.getManagerById = async (id) => {
    return await Manager.findById(id).select('-encryptedPassword');
};

exports.updateManager = async (id, data) => {
    if (data.password) {
        data.encryptedPassword = encryptManager(data.password);
        delete data.password;
    }
    return await Manager.findByIdAndUpdate(id, data, { new: true }).select('-encryptedPassword');
};

exports.getStudentById = async (id) => {
    return await Student.findById(id).select('-encryptedPassword');
};

exports.getParentById = async (id) => {
    return await Parent.findById(id).select('-encryptedPassword');
};