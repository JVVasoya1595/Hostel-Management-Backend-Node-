const mongoose = require('mongoose');

const parentCommunicationSchema = new mongoose.Schema({
    parent_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Parent',
        required: true,
    },
    student_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        default: null,
    },
    manager_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Manager',
        default: null,
    },
    subject: {
        type: String,
        required: true,
        trim: true,
    },
    message: {
        type: String,
        required: true,
        trim: true,
    },
    category: {
        type: String,
        enum: ['GENERAL', 'FEES', 'COMPLAINT', 'LEAVE', 'EMERGENCY'],
        default: 'GENERAL',
    },
    priority: {
        type: String,
        enum: ['LOW', 'NORMAL', 'HIGH', 'URGENT'],
        default: 'NORMAL',
    },
    status: {
        type: String,
        enum: ['OPEN', 'IN_PROGRESS', 'CLOSED'],
        default: 'OPEN',
    },
}, { timestamps: true });

module.exports = mongoose.model('ParentCommunication', parentCommunicationSchema);
