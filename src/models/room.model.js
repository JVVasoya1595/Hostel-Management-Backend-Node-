const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
    room_number: { type: String, required: true },
    floor_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Floor', required: true },
    total_beds: { type: Number, default: 2 },
    occupied_beds: { type: Number, default: 0 },
    status: { type: String, enum: ['AVAILABLE', 'FULL'], default: 'AVAILABLE' }
}, { timestamps: true });

module.exports = mongoose.model('Room', roomSchema);
