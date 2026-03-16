const mongoose = require('mongoose');

const accessoryIssueSchema = new mongoose.Schema({
    student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    accessory_type: { type: String, required: true, trim: true },
    item_code: { type: String, default: null, trim: true },
    quantity: { type: Number, default: 1 },

    status: { type: String, enum: ['ISSUED', 'RETURNED', 'LOST', 'BROKEN'], default: 'ISSUED' },
    issued_at: { type: Date, default: Date.now },
    returned_at: { type: Date, default: null },

    charge_amount: { type: Number, default: 0 },
    remarks: { type: String, default: null, trim: true },

    recorded_by_manager_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Manager', default: null },
}, { timestamps: true });

accessoryIssueSchema.index({ student_id: 1, createdAt: -1 });
accessoryIssueSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('AccessoryIssue', accessoryIssueSchema);

