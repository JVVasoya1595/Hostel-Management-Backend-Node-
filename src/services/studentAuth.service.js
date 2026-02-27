const Student = require('../models/student.model');
const { encrypt, decrypt } = require('../utils/encryption/student.encrypt');
const jwt = require('jsonwebtoken');

exports.register = async (data) => {
    const encryptedPassword = encrypt(data.password);
    return await Student.create({ ...data, encryptedPassword });
};

exports.login = async (email, password) => {
    const student = await Student.findOne({ email });
    if (!student) throw new Error("Student not found");

    const decrypted = decrypt(student.encryptedPassword);
    if (decrypted !== password) throw new Error("Invalid password");

    return jwt.sign({ id: student._id, role: student.role }, process.env.JWT_SECRET);
};

exports.getProfile = async (id) => {
    return await Student.findById(id).select('-encryptedPassword');
};