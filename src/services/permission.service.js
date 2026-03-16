const PermissionGrant = require('../models/permissionGrant.model');

const sanitize = (document) => {
    if (!document) return null;
    return typeof document.toObject === 'function' ? document.toObject() : { ...document };
};

const listGrants = async (filters = {}) => {
    const query = {};
    if (filters.subject_type) query.subject_type = String(filters.subject_type).trim().toUpperCase();
    if (filters.subject_role) query.subject_role = String(filters.subject_role).trim().toUpperCase();
    if (filters.subject_user_id) query.subject_user_id = filters.subject_user_id;

    const grants = await PermissionGrant.find(query).sort({ createdAt: -1 });
    return grants.map(sanitize);
};

const upsertRoleGrant = async (adminId, payload = {}) => {
    const subject_role = String(payload.subject_role || '').trim().toUpperCase();
    if (!subject_role) throw new Error('subject_role is required');

    const permissions = Array.isArray(payload.permissions)
        ? payload.permissions.map((p) => String(p || '').trim()).filter(Boolean)
        : [];

    const grant = await PermissionGrant.findOneAndUpdate(
        { subject_type: 'ROLE', subject_role },
        {
            subject_type: 'ROLE',
            subject_role,
            permissions,
            is_enabled: payload.is_enabled !== undefined ? Boolean(payload.is_enabled) : true,
            created_by_admin_id: adminId,
            notes: payload.notes ? String(payload.notes).trim() : null,
        },
        { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return sanitize(grant);
};

const upsertUserGrant = async (adminId, payload = {}) => {
    const subject_user_id = payload.subject_user_id;
    const subject_user_role = String(payload.subject_user_role || '').trim().toUpperCase();
    if (!subject_user_id) throw new Error('subject_user_id is required');
    if (!subject_user_role) throw new Error('subject_user_role is required');

    const permissions = Array.isArray(payload.permissions)
        ? payload.permissions.map((p) => String(p || '').trim()).filter(Boolean)
        : [];

    const grant = await PermissionGrant.findOneAndUpdate(
        { subject_type: 'USER', subject_user_id },
        {
            subject_type: 'USER',
            subject_user_id,
            subject_user_role,
            permissions,
            is_enabled: payload.is_enabled !== undefined ? Boolean(payload.is_enabled) : true,
            created_by_admin_id: adminId,
            notes: payload.notes ? String(payload.notes).trim() : null,
        },
        { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return sanitize(grant);
};

module.exports = {
    listGrants,
    upsertRoleGrant,
    upsertUserGrant,
};

