const Parent = require('../models/parent.model');
const { encryptData, decryptData } = require('../utils/encryption/parent.encrypt');
const jwt = require('jsonwebtoken');

exports.register = async (data) => {
    const existing = await Parent.findOne({ email: data.email });
    if (existing) throw new Error('A parent with this email already exists');
    const { password, ...rest } = data;
    const encryptedPassword = encryptData({ password });
    return await Parent.create({ ...rest, encryptedPassword });
};

exports.login = async (email, password) => {
    const parent = await Parent.findOne({ email });
    if (!parent) throw new Error("Parent not found");

    const decrypted = decryptData(parent.encryptedPassword);
    if (decrypted.password !== password) throw new Error("Invalid password");

    return jwt.sign({ id: parent._id, role: parent.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

exports.getProfile = async (id) => {
    return await Parent.findById(id).select('-encryptedPassword');
};

exports.updateProfile = async (id, data) => {
    // Parents cannot change their email or password through this route
    if (data.email || data.password) {
        throw new Error("You cannot change your email or password through profile update.");
    }
    return await Parent.findByIdAndUpdate(id, data, { new: true }).select('-encryptedPassword');
};