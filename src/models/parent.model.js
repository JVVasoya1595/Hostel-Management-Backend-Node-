const mongoose = require('mongoose');

const parentSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    encryptedPassword: String,
    role: { type: String, default: "PARENT" }
}, { timestamps: true });

module.exports = mongoose.model('Parent', parentSchema);