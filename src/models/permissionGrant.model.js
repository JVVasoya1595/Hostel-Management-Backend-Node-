const mongoose = require('mongoose');

/**
 * PermissionGrant is a simple backend-only ACL layer.
 * - Role grants apply to all users of a role.
 * - User grants override for a specific user (e.g., Manager).
 *
 * Permissions are opaque strings we’ll standardize later (e.g., "ADMISSIONS:APPROVE").
 */
const permissionGrantSchema = new mongoose.Schema({
    subject_type: { type: String, enum: ['ROLE', 'USER'], required: true },

    // For subject_type=ROLE
    subject_role: {
        type: String,
        enum: ['ADMIN', 'MANAGER', 'WARDEN', 'STUDENT', 'PARENT', 'SECURITY'],
        default: null,
    },

    // For subject_type=USER (no strict ref to keep it generic across user collections)
    subject_user_id: { type: mongoose.Schema.Types.ObjectId, default: null },
    subject_user_role: {
        type: String,
        enum: ['ADMIN', 'MANAGER', 'WARDEN', 'STUDENT', 'PARENT', 'SECURITY'],
        default: null,
    },

    permissions: { type: [String], default: [] },
    is_enabled: { type: Boolean, default: true },

    created_by_admin_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', default: null },
    notes: { type: String, default: null, trim: true },
}, { timestamps: true });

permissionGrantSchema.index(
    { subject_type: 1, subject_role: 1 },
    { unique: true, partialFilterExpression: { subject_type: 'ROLE' } }
);

permissionGrantSchema.index(
    { subject_type: 1, subject_user_id: 1 },
    { unique: true, partialFilterExpression: { subject_type: 'USER' } }
);

module.exports = mongoose.model('PermissionGrant', permissionGrantSchema);

