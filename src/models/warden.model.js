const mongoose = require('mongoose');

const wardenSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    email: { type: String, unique: true, required: true, lowercase: true, trim: true },
    phone: { type: String, default: null, trim: true },
    encryptedPassword: { type: String, default: null },
    role: { type: String, default: 'WARDEN' },
    building_name: { type: String, default: null, trim: true },
    assigned_floor_ids: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Floor',
    }],
    status: {
        type: String,
        enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED'],
        default: 'ACTIVE',
    },
}, { timestamps: true });

module.exports = mongoose.model('Warden', wardenSchema);

