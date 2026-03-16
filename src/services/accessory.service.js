const AccessoryIssue = require('../models/accessoryIssue.model');

const sanitize = (document) => {
    if (!document) return null;
    return typeof document.toObject === 'function' ? document.toObject() : { ...document };
};

const issueAccessory = async (managerId, payload = {}) => {
    const student_id = payload.student_id;
    const accessory_type = String(payload.accessory_type || '').trim();
    if (!student_id || !accessory_type) throw new Error('student_id and accessory_type are required');

    const issue = await AccessoryIssue.create({
        student_id,
        accessory_type,
        item_code: payload.item_code || null,
        quantity: Number(payload.quantity) || 1,
        status: 'ISSUED',
        charge_amount: Number(payload.charge_amount) || 0,
        remarks: payload.remarks ? String(payload.remarks).trim() : null,
        recorded_by_manager_id: managerId,
    });

    return sanitize(issue);
};

const updateAccessoryStatus = async (managerId, payload = {}) => {
    const issue_id = payload.issue_id || payload.id;
    const status = String(payload.status || '').trim().toUpperCase();
    if (!issue_id) throw new Error('issue_id is required');
    if (!['ISSUED', 'RETURNED', 'LOST', 'BROKEN'].includes(status)) throw new Error('Invalid status');

    const issue = await AccessoryIssue.findById(issue_id);
    if (!issue) throw new Error('Accessory issue not found');

    issue.status = status;
    if (status === 'RETURNED') issue.returned_at = new Date();
    if (payload.charge_amount !== undefined) issue.charge_amount = Number(payload.charge_amount) || 0;
    if (payload.remarks !== undefined) issue.remarks = payload.remarks ? String(payload.remarks).trim() : null;
    issue.recorded_by_manager_id = managerId;
    await issue.save();

    return sanitize(issue);
};

const listAccessories = async (filters = {}) => {
    const query = {};
    if (filters.student_id) query.student_id = filters.student_id;
    if (filters.status) query.status = String(filters.status).trim().toUpperCase();

    const issues = await AccessoryIssue.find(query).sort({ createdAt: -1 });
    return issues.map(sanitize);
};

module.exports = {
    issueAccessory,
    updateAccessoryStatus,
    listAccessories,
};

