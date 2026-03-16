const crypto = require('crypto');
const GatePass = require('../models/gatePass.model');
const Parent = require('../models/parent.model');

const sanitize = (document) => {
    if (!document) return null;
    return typeof document.toObject === 'function' ? document.toObject() : { ...document };
};

const generateCode = () => crypto.randomBytes(8).toString('hex').toUpperCase();

const ensureParentLinkedToStudent = async (parentId, studentId) => {
    const parent = await Parent.findById(parentId).select('student_ids');
    if (!parent) throw new Error('Parent not found');
    const linked = (parent.student_ids || []).some((id) => String(id) === String(studentId));
    if (!linked) throw new Error('Parent is not linked to this student');
};

const requestGatePass = async (studentId, payload = {}) => {
    const reason = String(payload.reason || '').trim();
    if (!reason) throw new Error('reason is required');

    const from_date = new Date(payload.from_date);
    const to_date = new Date(payload.to_date);
    if (Number.isNaN(from_date.getTime()) || Number.isNaN(to_date.getTime())) {
        throw new Error('from_date and to_date must be valid dates');
    }

    const gatePass = await GatePass.create({
        student_id: studentId,
        parent_id: payload.parent_id || null,
        manager_id: payload.manager_id || null,
        leave_request_id: payload.leave_request_id || null,
        request_type: payload.request_type || 'LEAVE',
        reason,
        from_date,
        to_date,
        status: payload.require_parent_approval ? 'PENDING_PARENT' : 'PENDING_MANAGER',
        expires_at: payload.expires_at ? new Date(payload.expires_at) : to_date,
    });

    return sanitize(gatePass);
};

const listGatePasses = async (actor, filters = {}) => {
    const role = String(actor?.role || '').toLowerCase();
    const query = {};

    if (filters.student_id) query.student_id = filters.student_id;
    if (filters.status) query.status = String(filters.status).trim().toUpperCase();

    if (role === 'student') query.student_id = actor.user._id;
    if (role === 'parent') query.parent_id = actor.user._id;
    if (role === 'manager') query.manager_id = actor.user._id;

    const passes = await GatePass.find(query).sort({ createdAt: -1 });
    return passes.map(sanitize);
};

const parentDecision = async (parentId, payload = {}) => {
    const gate_pass_id = payload.gate_pass_id || payload.id;
    const decision = String(payload.decision || '').trim().toUpperCase();
    if (!gate_pass_id) throw new Error('gate_pass_id is required');
    if (!['APPROVE', 'REJECT'].includes(decision)) throw new Error('decision must be APPROVE or REJECT');

    const gatePass = await GatePass.findById(gate_pass_id);
    if (!gatePass) throw new Error('Gate pass not found');

    await ensureParentLinkedToStudent(parentId, gatePass.student_id);

    gatePass.parent_id = gatePass.parent_id || parentId;
    gatePass.parent_decision.status = decision === 'APPROVE' ? 'APPROVED' : 'REJECTED';
    gatePass.parent_decision.decided_at = new Date();
    gatePass.parent_decision.remarks = payload.remarks ? String(payload.remarks).trim() : null;

    if (decision === 'REJECT') {
        gatePass.status = 'REJECTED';
    } else if (gatePass.status === 'PENDING_PARENT') {
        gatePass.status = 'PENDING_MANAGER';
    }

    await gatePass.save();
    return sanitize(gatePass);
};

const managerDecision = async (managerId, payload = {}) => {
    const gate_pass_id = payload.gate_pass_id || payload.id;
    const decision = String(payload.decision || '').trim().toUpperCase();
    if (!gate_pass_id) throw new Error('gate_pass_id is required');
    if (!['APPROVE', 'REJECT'].includes(decision)) throw new Error('decision must be APPROVE or REJECT');

    const gatePass = await GatePass.findById(gate_pass_id);
    if (!gatePass) throw new Error('Gate pass not found');

    gatePass.manager_id = gatePass.manager_id || managerId;
    gatePass.manager_decision.status = decision === 'APPROVE' ? 'APPROVED' : 'REJECTED';
    gatePass.manager_decision.decided_at = new Date();
    gatePass.manager_decision.remarks = payload.remarks ? String(payload.remarks).trim() : null;

    if (decision === 'REJECT') {
        gatePass.status = 'REJECTED';
    } else {
        gatePass.status = 'APPROVED';
        if (!gatePass.code) gatePass.code = generateCode();
        if (!gatePass.issued_at) gatePass.issued_at = new Date();
    }

    await gatePass.save();
    return sanitize(gatePass);
};

module.exports = {
    requestGatePass,
    listGatePasses,
    parentDecision,
    managerDecision,
};

