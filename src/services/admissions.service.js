const StudentAdmission = require('../models/studentAdmission.model');

const sanitize = (document) => {
    if (!document) return null;
    return typeof document.toObject === 'function' ? document.toObject() : { ...document };
};

const stripAuthFields = (payload = {}) => {
    const next = { ...payload };
    delete next.token;
    delete next.id;
    delete next.email;
    delete next.role;
    delete next.createdAt;
    delete next.updatedAt;
    return next;
};

const ensureAllowedAdmissionUpdate = (admission) => {
    if (!admission) throw new Error('Admission not found');
    if (!['DRAFT', 'REJECTED', 'CANCELLED'].includes(admission.status)) {
        throw new Error('Admission cannot be modified in the current status');
    }
};

const createAdmission = async (managerId, payload = {}) => {
    const cleanPayload = stripAuthFields(payload);
    const student_name = String(payload.student_name || '').trim();
    const student_phone = String(payload.student_phone || '').trim();
    const parent_name = String(payload.parent_name || '').trim();
    const parent_phone = String(payload.parent_phone || '').trim();

    if (!student_name || !student_phone || !parent_name || !parent_phone) {
        throw new Error('student_name, student_phone, parent_name, parent_phone are required');
    }

    const admission = await StudentAdmission.create({
        ...cleanPayload,
        source: 'MANAGER',
        created_by_manager_id: managerId,
        status: 'DRAFT',
        student_name,
        student_phone,
        parent_name,
        parent_phone,
        student_email: cleanPayload.student_email ? String(cleanPayload.student_email).trim().toLowerCase() : null,
        parent_email: cleanPayload.parent_email ? String(cleanPayload.parent_email).trim().toLowerCase() : null,
    });

    return sanitize(admission);
};

const updateAdmission = async (managerId, payload = {}) => {
    const admission_id = payload.admission_id || payload.id;
    if (!admission_id) throw new Error('admission_id is required');

    const admission = await StudentAdmission.findById(admission_id);
    if (!admission) throw new Error('Admission not found');
    if (String(admission.created_by_manager_id || '') !== String(managerId || '')) {
        throw new Error('Forbidden');
    }

    ensureAllowedAdmissionUpdate(admission);

    const mutable = stripAuthFields(payload);
    delete mutable.admission_id;
    delete mutable.id;
    delete mutable.status;
    delete mutable.source;
    delete mutable.reg_no;
    delete mutable.student_id;
    delete mutable.parent_id;
    delete mutable.created_by_manager_id;
    delete mutable.submitted_at;
    delete mutable.reviewed_by;
    delete mutable.reviewed_at;

    if (mutable.student_email) mutable.student_email = String(mutable.student_email).trim().toLowerCase();
    if (mutable.parent_email) mutable.parent_email = String(mutable.parent_email).trim().toLowerCase();

    Object.assign(admission, mutable);
    await admission.save();
    return sanitize(admission);
};

const submitAdmission = async (managerId, payload = {}) => {
    const admission_id = payload.admission_id || payload.id;
    if (!admission_id) throw new Error('admission_id is required');

    const admission = await StudentAdmission.findById(admission_id);
    if (!admission) throw new Error('Admission not found');
    if (String(admission.created_by_manager_id || '') !== String(managerId || '')) {
        throw new Error('Forbidden');
    }

    if (!['DRAFT', 'REJECTED'].includes(admission.status)) {
        throw new Error('Admission cannot be submitted in the current status');
    }

    admission.status = 'SUBMITTED';
    admission.submitted_at = new Date();
    await admission.save();

    return sanitize(admission);
};

const listAdmissions = async (actor, filters = {}) => {
    const role = String(actor?.role || '').toLowerCase();
    const query = {};

    if (role === 'manager') {
        query.created_by_manager_id = actor.user._id;
    }

    if (filters.status) {
        query.status = String(filters.status).trim().toUpperCase();
    }

    if (filters.student_phone) {
        query.student_phone = String(filters.student_phone).trim();
    }

    const admissions = await StudentAdmission.find(query).sort({ createdAt: -1 });
    return admissions.map(sanitize);
};

const decideAdmission = async (adminId, payload = {}) => {
    const admission_id = payload.admission_id || payload.id;
    const decision = String(payload.decision || '').trim().toUpperCase();
    if (!admission_id) throw new Error('admission_id is required');
    if (!['APPROVE', 'REJECT'].includes(decision)) throw new Error('decision must be APPROVE or REJECT');

    const admission = await StudentAdmission.findById(admission_id);
    if (!admission) throw new Error('Admission not found');
    if (!['SUBMITTED', 'UNDER_REVIEW'].includes(admission.status)) {
        throw new Error('Admission is not pending review');
    }

    admission.reviewed_by = adminId;
    admission.reviewed_at = new Date();
    admission.decision_remarks = payload.remarks ? String(payload.remarks).trim() : null;

    if (decision === 'APPROVE') {
        admission.status = 'APPROVED';
        // reg_no generation and account creation are handled later in a dedicated step.
        if (!admission.reg_no) {
            admission.reg_no = `REG-${Date.now()}`;
        }
    } else {
        admission.status = 'REJECTED';
    }

    await admission.save();
    return sanitize(admission);
};

module.exports = {
    createAdmission,
    updateAdmission,
    submitAdmission,
    listAdmissions,
    decideAdmission,
};
