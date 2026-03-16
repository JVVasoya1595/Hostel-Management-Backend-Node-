const mongoose = require('mongoose');

const refundRequestSchema = new mongoose.Schema({
    student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    type: { type: String, enum: ['SECURITY_DEPOSIT', 'OTHER'], default: 'OTHER' },
    amount: { type: Number, required: true },
    reason: { type: String, default: null, trim: true },

    status: {
        type: String,
        enum: ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'PAID', 'CANCELLED'],
        default: 'SUBMITTED',
    },

    reviewed_by_admin_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', default: null },
    reviewed_at: { type: Date, default: null },
    decision_notes: { type: String, default: null, trim: true },
    paid_at: { type: Date, default: null },
}, { timestamps: true });

refundRequestSchema.index({ student_id: 1, createdAt: -1 });
refundRequestSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('RefundRequest', refundRequestSchema);

