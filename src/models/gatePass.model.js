const mongoose = require('mongoose');

const gatePassDecisionSchema = new mongoose.Schema({
    status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED'], default: 'PENDING' },
    decided_at: { type: Date, default: null },
    remarks: { type: String, default: null, trim: true },
}, { _id: false });

const gatePassSchema = new mongoose.Schema({
    student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    parent_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Parent', default: null },
    manager_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Manager', default: null },
    leave_request_id: { type: mongoose.Schema.Types.ObjectId, ref: 'LeaveRequest', default: null },

    request_type: { type: String, enum: ['LEAVE', 'TEMP_EXIT'], default: 'LEAVE' },
    reason: { type: String, required: true, trim: true },
    from_date: { type: Date, required: true },
    to_date: { type: Date, required: true },

    status: {
        type: String,
        enum: ['PENDING_PARENT', 'PENDING_MANAGER', 'APPROVED', 'REJECTED', 'CANCELLED', 'EXPIRED', 'USED'],
        default: 'PENDING_MANAGER',
    },

    parent_decision: { type: gatePassDecisionSchema, default: () => ({}) },
    manager_decision: { type: gatePassDecisionSchema, default: () => ({}) },

    code: { type: String, unique: true, sparse: true, trim: true },
    issued_at: { type: Date, default: null },
    used_at: { type: Date, default: null },
    expires_at: { type: Date, default: null },
}, { timestamps: true });

gatePassSchema.index({ student_id: 1, createdAt: -1 });
gatePassSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('GatePass', gatePassSchema);

