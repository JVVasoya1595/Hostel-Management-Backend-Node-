const mongoose = require('mongoose');

const bedSchema = new mongoose.Schema({
    bed_number: { type: String, required: true },
    room_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
    is_occupied: { type: Boolean, default: false },
    student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', default: null }
}, { timestamps: true });

module.exports = mongoose.model('Bed', bedSchema);
