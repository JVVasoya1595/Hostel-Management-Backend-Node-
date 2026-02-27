const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    encryptedPassword: String,
    role: { type: String, default: "STUDENT" },
    status: { type: String, enum: ['PENDING', 'ALLOTTED'], default: 'PENDING' },
    room_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', default: null },
    bed_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Bed', default: null }
}, { timestamps: true });

module.exports = mongoose.model('Student', studentSchema);