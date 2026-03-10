const mongoose = require('mongoose');

const managerSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, unique: true, required: true, lowercase: true, trim: true },
    phone: { type: String, default: null },
    encryptedPassword: String,
    role: { type: String, default: "MANAGER" },
    building_name: { type: String, default: null, trim: true },
    assigned_floor_ids: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Floor',
    }],
}, { timestamps: true });

module.exports = mongoose.model('Manager', managerSchema);
