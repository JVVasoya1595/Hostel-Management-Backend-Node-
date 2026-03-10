const mongoose = require('mongoose');

const emergencyContactSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    relationship: { type: String, default: null, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, default: null, lowercase: true, trim: true },
    is_primary: { type: Boolean, default: false },
}, { _id: false });

const parentSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, unique: true, required: true, lowercase: true, trim: true },
    phone: { type: String, default: null },
    encryptedPassword: String,
    role: { type: String, default: "PARENT" },
    relationship: { type: String, default: 'PARENT', trim: true },
    address: { type: String, default: null, trim: true },
    student_ids: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
    }],
    emergency_contacts: [emergencyContactSchema],
}, { timestamps: true });

module.exports = mongoose.model('Parent', parentSchema);
