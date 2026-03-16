const mongoose = require('mongoose');

const foodSlotMarkSchema = new mongoose.Schema({
    student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    date: { type: Date, required: true },
    breakfast: { type: Boolean, default: false },
    lunch: { type: Boolean, default: false },
    dinner: { type: Boolean, default: false },
    updated_at: { type: Date, default: Date.now },
}, { timestamps: true });

foodSlotMarkSchema.index({ student_id: 1, date: 1 }, { unique: true });
foodSlotMarkSchema.index({ date: 1 });

module.exports = mongoose.model('FoodSlotMark', foodSlotMarkSchema);

