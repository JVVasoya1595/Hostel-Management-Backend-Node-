const mongoose = require('mongoose');

const managerSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    encryptedPassword: String,
    role: { type: String, default: "MANAGER" }
}, { timestamps: true });

module.exports = mongoose.model('Manager', managerSchema);