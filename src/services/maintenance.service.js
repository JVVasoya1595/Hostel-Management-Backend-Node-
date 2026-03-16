const MaintenanceRequest = require('../models/maintenanceRequest.model');
const Student = require('../models/student.model');

const sanitize = (document) => {
    if (!document) return null;
    return typeof document.toObject === 'function' ? document.toObject() : { ...document };
};

const createRequest = async (studentId, payload = {}) => {
    const title = String(payload.title || '').trim();
    const description = String(payload.description || '').trim();
    if (!title || !description) throw new Error('title and description are required');

    const student = await Student.findById(studentId).select('room_id bed_id');
    if (!student) throw new Error('Student not found');

    const request = await MaintenanceRequest.create({
        student_id: studentId,
        room_id: student.room_id || null,
        bed_id: student.bed_id || null,
        category: payload.category || 'OTHER',
        title,
        description,
        photos: Array.isArray(payload.photos) ? payload.photos : [],
    });

    return sanitize(request);
};

const listRequests = async (actor, filters = {}) => {
    const role = String(actor?.role || '').toLowerCase();
    const query = {};

    if (filters.status) query.status = String(filters.status).trim().toUpperCase();
    if (filters.student_id) query.student_id = filters.student_id;

    if (role === 'student') query.student_id = actor.user._id;

    const requests = await MaintenanceRequest.find(query).sort({ createdAt: -1 });
    return requests.map(sanitize);
};

const assignRequest = async (actor, payload = {}) => {
    const request_id = payload.request_id || payload.id;
    if (!request_id) throw new Error('request_id is required');

    const request = await MaintenanceRequest.findById(request_id);
    if (!request) throw new Error('Maintenance request not found');

    if (payload.assigned_manager_id !== undefined) {
        request.assigned_manager_id = payload.assigned_manager_id || null;
    }
    if (payload.assigned_warden_id !== undefined) {
        request.assigned_warden_id = payload.assigned_warden_id || null;
    }

    request.status = 'IN_PROGRESS';
    await request.save();
    return sanitize(request);
};

const updateStatus = async (actor, payload = {}) => {
    const request_id = payload.request_id || payload.id;
    const status = String(payload.status || '').trim().toUpperCase();
    if (!request_id) throw new Error('request_id is required');
    if (!['PENDING', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REJECTED'].includes(status)) {
        throw new Error('Invalid status');
    }

    const request = await MaintenanceRequest.findById(request_id);
    if (!request) throw new Error('Maintenance request not found');

    request.status = status;
    if (payload.resolution_notes !== undefined) {
        request.resolution_notes = payload.resolution_notes ? String(payload.resolution_notes).trim() : null;
    }
    if (status === 'RESOLVED') {
        request.resolution_date = new Date();
    }

    await request.save();
    return sanitize(request);
};

module.exports = {
    createRequest,
    listRequests,
    assignRequest,
    updateStatus,
};

