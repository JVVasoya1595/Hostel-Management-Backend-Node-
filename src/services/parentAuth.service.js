const Parent = require('../models/parent.model');
const { encrypt, decrypt } = require('../utils/encryption/parent.encrypt');
const jwt = require('jsonwebtoken');

exports.register = async (data) => {
    const encryptedPassword = await encrypt(data.password);
    return await Parent.create({ ...data, encryptedPassword });
};

exports.login = async (email, password) => {
    const parent = await Parent.findOne({ email });
    if (!parent) throw new Error("Parent not found");

    const isMatch = await decrypt(password, parent.encryptedPassword);
    if (!isMatch) throw new Error("Invalid password");

    return jwt.sign({ id: parent._id, role: parent.role }, process.env.JWT_SECRET);
};

exports.getProfile = async (id) => {
    return await Parent.findById(id).select('-encryptedPassword');
};