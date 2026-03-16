const RefundRequest = require('../models/refundRequest.model');

const sanitize = (document) => {
    if (!document) return null;
    return typeof document.toObject === 'function' ? document.toObject() : { ...document };
};

const submitRefundRequest = async (studentId, payload = {}) => {
    const amount = Number(payload.amount);
    if (!Number.isFinite(amount) || amount <= 0) throw new Error('amount must be a positive number');

    const request = await RefundRequest.create({
        student_id: studentId,
        type: payload.type || 'OTHER',
        amount,
        reason: payload.reason ? String(payload.reason).trim() : null,
        status: 'SUBMITTED',
    });

    return sanitize(request);
};

const listRefundRequests = async (actor, filters = {}) => {
    const role = String(actor?.role || '').toLowerCase();
    const query = {};

    if (role === 'student') query.student_id = actor.user._id;
    if (filters.student_id) query.student_id = filters.student_id;
    if (filters.status) query.status = String(filters.status).trim().toUpperCase();

    const requests = await RefundRequest.find(query).sort({ createdAt: -1 });
    return requests.map(sanitize);
};

const decideRefundRequest = async (adminId, payload = {}) => {
    const request_id = payload.request_id || payload.id;
    const decision = String(payload.decision || '').trim().toUpperCase();
    if (!request_id) throw new Error('request_id is required');
    if (!['APPROVE', 'REJECT'].includes(decision)) throw new Error('decision must be APPROVE or REJECT');

    const request = await RefundRequest.findById(request_id);
    if (!request) throw new Error('Refund request not found');

    request.status = decision === 'APPROVE' ? 'APPROVED' : 'REJECTED';
    request.reviewed_by_admin_id = adminId;
    request.reviewed_at = new Date();
    request.decision_notes = payload.notes ? String(payload.notes).trim() : null;
    await request.save();

    return sanitize(request);
};

const markRefundPaid = async (adminId, payload = {}) => {
    const request_id = payload.request_id || payload.id;
    if (!request_id) throw new Error('request_id is required');

    const request = await RefundRequest.findById(request_id);
    if (!request) throw new Error('Refund request not found');
    if (request.status !== 'APPROVED') throw new Error('Refund request is not approved');

    request.status = 'PAID';
    request.paid_at = new Date();
    request.reviewed_by_admin_id = adminId;
    await request.save();

    return sanitize(request);
};

module.exports = {
    submitRefundRequest,
    listRefundRequests,
    decideRefundRequest,
    markRefundPaid,
};

