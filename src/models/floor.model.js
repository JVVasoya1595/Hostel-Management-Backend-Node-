const mongoose = require('mongoose');

const floorSchema = new mongoose.Schema({
    floor_number: { type: Number, unique: true, required: true },
    total_capacity: { type: Number, default: 4 },
    status: { type: String, enum: ['AVAILABLE', 'FULL'], default: 'AVAILABLE' }
}, { timestamps: true });

module.exports = mongoose.model('Floor', floorSchema);
