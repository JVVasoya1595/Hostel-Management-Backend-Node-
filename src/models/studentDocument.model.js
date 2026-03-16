const mongoose = require('mongoose');

const studentDocumentSchema = new mongoose.Schema({
    admission_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'StudentAdmission',
        default: null,
    },
    student_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        default: null,
    },
    type: {
        type: String,
        default: 'DOCUMENT',
        trim: true,
    },
    title: { type: String, default: null, trim: true },

    storage: {
        provider: { type: String, default: 'LOCAL', trim: true },
        url: { type: String, default: null, trim: true },
        path: { type: String, default: null, trim: true },
        filename: { type: String, default: null, trim: true },
        content_type: { type: String, default: null, trim: true },
        size_bytes: { type: Number, default: null },
    },

    uploaded_by: {
        role: { type: String, enum: ['ADMIN', 'MANAGER', 'WARDEN', 'STUDENT', 'PARENT'], required: true },
        user_id: { type: mongoose.Schema.Types.ObjectId, required: true },
    },

    verification_status: {
        type: String,
        enum: ['PENDING', 'VERIFIED', 'REJECTED'],
        default: 'PENDING',
    },
    verified_by: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', default: null },
    verified_at: { type: Date, default: null },
    verification_notes: { type: String, default: null, trim: true },
}, { timestamps: true });

studentDocumentSchema.index({ admission_id: 1, createdAt: -1 });
studentDocumentSchema.index({ student_id: 1, createdAt: -1 });

module.exports = mongoose.model('StudentDocument', studentDocumentSchema);

