const mongoose = require('mongoose');

const parentSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, unique: true, required: true, lowercase: true, trim: true },
    phone: { type: String, default: null },
    encryptedPassword: String,
    role: { type: String, default: "PARENT" }
}, { timestamps: true });

module.exports = mongoose.model('Parent', parentSchema);