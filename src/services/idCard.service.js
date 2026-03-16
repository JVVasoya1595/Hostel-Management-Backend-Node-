const crypto = require('crypto');
const StudentIdCard = require('../models/studentIdCard.model');

const sanitize = (document) => {
    if (!document) return null;
    return typeof document.toObject === 'function' ? document.toObject() : { ...document };
};

const generateCardNumber = () => `CARD-${Date.now()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
const generateBarcode = () => crypto.randomBytes(8).toString('hex').toUpperCase();

const issueCard = async (managerId, payload = {}) => {
    const student_id = payload.student_id;
    if (!student_id) throw new Error('student_id is required');

    const card = await StudentIdCard.create({
        student_id,
        card_number: payload.card_number ? String(payload.card_number).trim() : generateCardNumber(),
        barcode_value: payload.barcode_value ? String(payload.barcode_value).trim() : generateBarcode(),
        issued_by_manager_id: managerId,
        replacement_fee: Number(payload.replacement_fee) || 0,
        notes: payload.notes ? String(payload.notes).trim() : null,
    });

    return sanitize(card);
};

const replaceCard = async (managerId, payload = {}) => {
    const previous_id = payload.previous_id || payload.id;
    if (!previous_id) throw new Error('previous_id is required');

    const prev = await StudentIdCard.findById(previous_id);
    if (!prev) throw new Error('ID card not found');

    prev.status = payload.previous_status
        ? String(payload.previous_status).trim().toUpperCase()
        : 'REPLACED';
    await prev.save();

    return issueCard(managerId, {
        student_id: prev.student_id,
        replacement_fee: payload.replacement_fee || prev.replacement_fee || 0,
        notes: payload.notes || 'Replacement issued',
    });
};

const listCards = async (filters = {}) => {
    const query = {};
    if (filters.student_id) query.student_id = filters.student_id;
    if (filters.status) query.status = String(filters.status).trim().toUpperCase();

    const cards = await StudentIdCard.find(query).sort({ createdAt: -1 });
    return cards.map(sanitize);
};

module.exports = {
    issueCard,
    replaceCard,
    listCards,
};

