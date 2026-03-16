const mongoose = require('mongoose');

const studentIdCardSchema = new mongoose.Schema({
    student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },

    card_number: { type: String, required: true, unique: true, trim: true },
    barcode_value: { type: String, required: true, unique: true, trim: true },

    status: {
        type: String,
        enum: ['ACTIVE', 'INACTIVE', 'REPLACED', 'LOST', 'DAMAGED'],
        default: 'ACTIVE',
    },

    issued_by_manager_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Manager', default: null },
    issued_at: { type: Date, default: Date.now },

    replacement_fee: { type: Number, default: 0 },
    notes: { type: String, default: null, trim: true },
}, { timestamps: true });

studentIdCardSchema.index({ student_id: 1, createdAt: -1 });

module.exports = mongoose.model('StudentIdCard', studentIdCardSchema);

