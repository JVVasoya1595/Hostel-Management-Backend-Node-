const mongoose = require('mongoose');

const maintenancePhotoSchema = new mongoose.Schema({
    url: { type: String, required: true, trim: true },
    caption: { type: String, default: null, trim: true },
}, { _id: false });

const maintenanceRequestSchema = new mongoose.Schema({
    student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    room_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', default: null },
    bed_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Bed', default: null },

    category: {
        type: String,
        enum: ['ELECTRICAL', 'PLUMBING', 'FURNITURE', 'CLEANLINESS', 'OTHER'],
        default: 'OTHER',
    },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    photos: { type: [maintenancePhotoSchema], default: [] },

    status: {
        type: String,
        enum: ['PENDING', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REJECTED'],
        default: 'PENDING',
    },

    assigned_manager_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Manager', default: null },
    assigned_warden_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Warden', default: null },

    resolution_notes: { type: String, default: null, trim: true },
    resolution_date: { type: Date, default: null },
}, { timestamps: true });

maintenanceRequestSchema.index({ student_id: 1, createdAt: -1 });
maintenanceRequestSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('MaintenanceRequest', maintenanceRequestSchema);

