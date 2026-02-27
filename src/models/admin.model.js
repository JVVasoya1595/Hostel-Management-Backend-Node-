const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    encryptedPassword: String,
    role: { type: String, default: "ADMIN" }
}, { timestamps: true });

module.exports = mongoose.model('Admin', adminSchema);