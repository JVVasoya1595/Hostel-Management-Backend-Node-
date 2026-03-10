const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    student_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        default: null,
    },
    room_number: {
        type: String,
        default: null,
    },
    floor_number: {
        type: Number,
        default: null,
    },
    title: {
        type: String,
        default: 'Notification',
    },
    message: {
        type: String,
        default: null,
    },
    type: {
        type: String,
        enum: ['ROOM_ALLOCATION', 'ANNOUNCEMENT', 'FEE_REMINDER', 'LEAVE_REQUEST', 'COMPLAINT', 'COMMUNICATION', 'SYSTEM'],
        default: 'ROOM_ALLOCATION',
    },
    recipient_role: {
        type: String,
        enum: ['ADMIN', 'MANAGER', 'STUDENT', 'PARENT', 'ALL'],
        default: 'PARENT',
    },
    created_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin',
        default: null,
    },
    is_read: {
        type: Boolean,
        default: false,
    },
    date: {
        type: Date,
        default: Date.now,
    },
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
