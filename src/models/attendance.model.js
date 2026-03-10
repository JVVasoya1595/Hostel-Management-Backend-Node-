const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
    student_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true,
    },
    manager_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Manager',
        required: true,
    },
    room_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Room',
        default: null,
    },
    floor_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Floor',
        default: null,
    },
    date: {
        type: Date,
        required: true,
    },
    status: {
        type: String,
        enum: ['PRESENT', 'ABSENT', 'ON_LEAVE'],
        required: true,
    },
    remarks: {
        type: String,
        default: null,
        trim: true,
    },
}, { timestamps: true });

attendanceSchema.index({ student_id: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
