const Student = require('../models/student.model');
const { encryptData, decryptData } = require('../utils/encryption/student.encrypt');
const jwt = require('jsonwebtoken');

exports.register = async (data) => {
    const existing = await Student.findOne({ email: data.email });
    if (existing) throw new Error('A student with this email already exists');
    const { password, ...rest } = data;
    const encryptedPassword = encryptData({ password });
    return await Student.create({ ...rest, encryptedPassword });
};

exports.login = async (email, password) => {
    const student = await Student.findOne({ email });
    if (!student) throw new Error("Student not found");

    const decrypted = decryptData(student.encryptedPassword);
    if (decrypted.password !== password) throw new Error("Invalid password");

    return jwt.sign({ id: student._id, role: student.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

exports.getProfile = async (id) => {
    return await Student.findById(id).select('-encryptedPassword');
};

exports.updateProfile = async (id, data) => {
    // Students cannot change their email or password through this route
    if (data.email || data.password) {
        throw new Error("You cannot change your email or password through profile update.");
    }
    return await Student.findByIdAndUpdate(id, data, { new: true }).select('-encryptedPassword');
};