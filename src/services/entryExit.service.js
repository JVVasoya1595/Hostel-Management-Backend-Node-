const EntryExitLog = require('../models/entryExitLog.model');

const sanitize = (document) => {
    if (!document) return null;
    return typeof document.toObject === 'function' ? document.toObject() : { ...document };
};

const recordEvent = async (actor, payload = {}) => {
    const student_id = payload.student_id;
    const direction = String(payload.direction || '').trim().toUpperCase();
    if (!student_id) throw new Error('student_id is required');
    if (!['ENTRY', 'EXIT'].includes(direction)) throw new Error('direction must be ENTRY or EXIT');

    const method = payload.method ? String(payload.method).trim().toUpperCase() : 'MANUAL';

    const log = await EntryExitLog.create({
        student_id,
        direction,
        scanned_at: payload.scanned_at ? new Date(payload.scanned_at) : new Date(),
        method,
        gate_pass_id: payload.gate_pass_id || null,
        id_card_id: payload.id_card_id || null,
        device_id: payload.device_id || null,
        recorded_by: {
            role: String(actor.user.role || '').trim().toUpperCase(),
            user_id: actor.user._id,
        },
        notes: payload.notes ? String(payload.notes).trim() : null,
    });

    return sanitize(log);
};

const listEvents = async (actor, filters = {}) => {
    const query = {};
    if (filters.student_id) query.student_id = filters.student_id;
    if (filters.direction) query.direction = String(filters.direction).trim().toUpperCase();

    const records = await EntryExitLog.find(query).sort({ scanned_at: -1, createdAt: -1 }).limit(Number(filters.limit) || 200);
    return records.map(sanitize);
};

module.exports = {
    recordEvent,
    listEvents,
};

