const StudentDocument = require('../models/studentDocument.model');

const sanitize = (document) => {
    if (!document) return null;
    return typeof document.toObject === 'function' ? document.toObject() : { ...document };
};

const uploadDocument = async (actor, payload = {}) => {
    const uploaded_by = {
        role: String(actor.user.role || '').trim().toUpperCase(),
        user_id: actor.user._id,
    };

    const admission_id = payload.admission_id || null;
    const student_id = payload.student_id || null;
    if (!admission_id && !student_id) {
        throw new Error('admission_id or student_id is required');
    }

    const storage = payload.storage || {};
    if (!storage.url && !storage.path) {
        throw new Error('storage.url or storage.path is required');
    }

    const doc = await StudentDocument.create({
        admission_id,
        student_id,
        type: payload.type || 'DOCUMENT',
        title: payload.title || null,
        storage: {
            provider: storage.provider || 'LOCAL',
            url: storage.url || null,
            path: storage.path || null,
            filename: storage.filename || null,
            content_type: storage.content_type || null,
            size_bytes: storage.size_bytes || null,
        },
        uploaded_by,
    });

    return sanitize(doc);
};

const listDocuments = async (filters = {}) => {
    const query = {};
    if (filters.admission_id) query.admission_id = filters.admission_id;
    if (filters.student_id) query.student_id = filters.student_id;
    if (filters.verification_status) query.verification_status = String(filters.verification_status).trim().toUpperCase();

    const docs = await StudentDocument.find(query).sort({ createdAt: -1 });
    return docs.map(sanitize);
};

const verifyDocument = async (adminId, payload = {}) => {
    const document_id = payload.document_id || payload.id;
    const status = String(payload.status || '').trim().toUpperCase();
    if (!document_id) throw new Error('document_id is required');
    if (!['VERIFIED', 'REJECTED', 'PENDING'].includes(status)) {
        throw new Error('status must be PENDING, VERIFIED or REJECTED');
    }

    const doc = await StudentDocument.findById(document_id);
    if (!doc) throw new Error('Document not found');

    doc.verification_status = status;
    doc.verified_by = adminId;
    doc.verified_at = new Date();
    doc.verification_notes = payload.notes ? String(payload.notes).trim() : null;
    await doc.save();

    return sanitize(doc);
};

module.exports = {
    uploadDocument,
    listDocuments,
    verifyDocument,
};

