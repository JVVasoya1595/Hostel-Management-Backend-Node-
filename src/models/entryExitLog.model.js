const mongoose = require('mongoose');

const entryExitLogSchema = new mongoose.Schema({
    student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    direction: { type: String, enum: ['ENTRY', 'EXIT'], required: true },
    scanned_at: { type: Date, default: Date.now },

    method: { type: String, enum: ['ID_CARD', 'GATE_PASS', 'MANUAL'], default: 'MANUAL' },
    gate_pass_id: { type: mongoose.Schema.Types.ObjectId, ref: 'GatePass', default: null },
    id_card_id: { type: mongoose.Schema.Types.ObjectId, ref: 'StudentIdCard', default: null },

    device_id: { type: String, default: null, trim: true },
    recorded_by: {
        role: { type: String, enum: ['ADMIN', 'MANAGER', 'WARDEN', 'SECURITY'], default: 'SECURITY' },
        user_id: { type: mongoose.Schema.Types.ObjectId, default: null },
    },
    notes: { type: String, default: null, trim: true },
}, { timestamps: true });

entryExitLogSchema.index({ student_id: 1, scanned_at: -1 });
entryExitLogSchema.index({ scanned_at: -1 });

module.exports = mongoose.model('EntryExitLog', entryExitLogSchema);

