const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, unique: true, required: true, lowercase: true, trim: true },
    phone: { type: String, default: null },
    encryptedPassword: String,
    role: { type: String, default: "STUDENT" },
    status: { type: String, enum: ['PENDING', 'ALLOTTED'], default: 'PENDING' },
    hostel_status: { type: String, enum: ['NOT_CHECKED_IN', 'CHECKED_IN', 'CHECKED_OUT'], default: 'NOT_CHECKED_IN' },
    room_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', default: null },
    bed_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Bed', default: null },
    check_in_date: { type: Date, default: null },
    check_out_date: { type: Date, default: null },
    checked_in_by: { type: mongoose.Schema.Types.ObjectId, ref: 'Manager', default: null },
    checked_out_by: { type: mongoose.Schema.Types.ObjectId, ref: 'Manager', default: null },
}, { timestamps: true });

module.exports = mongoose.model('Student', studentSchema);
