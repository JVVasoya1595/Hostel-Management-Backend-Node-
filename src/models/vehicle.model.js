const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
    student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    vehicle_type: { type: String, enum: ['BIKE', 'SCOOTER', 'CAR', 'OTHER'], default: 'OTHER' },
    registration_number: { type: String, required: true, trim: true, uppercase: true },
    make: { type: String, default: null, trim: true },
    model: { type: String, default: null, trim: true },
    color: { type: String, default: null, trim: true },
    is_active: { type: Boolean, default: true },
    registered_by_manager_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Manager', default: null },
}, { timestamps: true });

vehicleSchema.index({ registration_number: 1 }, { unique: true });
vehicleSchema.index({ student_id: 1, createdAt: -1 });

module.exports = mongoose.model('Vehicle', vehicleSchema);

