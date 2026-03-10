const Student = require('../models/student.model');
const Manager = require('../models/manager.model');
const LeaveRequest = require('../models/leaveRequest.model');
const Complaint = require('../models/complaint.model');
const FeePayment = require('../models/feePayment.model');
const Notification = require('../models/notification.model');
const hostelPolicies = require('../data/hostelPolicies');
const notificationService = require('./notification.service');

const STUDENT_POPULATION = [
    {
        path: 'room_id',
        select: 'room_number status floor_id total_beds occupied_beds',
        populate: {
            path: 'floor_id',
            select: 'floor_number status total_capacity',
        },
    },
    {
        path: 'bed_id',
        select: 'bed_number is_occupied',
    },
    {
        path: 'checked_in_by',
        select: 'name email phone building_name',
    },
    {
        path: 'checked_out_by',
        select: 'name email phone building_name',
    },
];

const sanitizeDocument = (document) => {
    if (!document) {
        return null;
    }

    const object = typeof document.toObject === 'function'
        ? document.toObject()
        : { ...document };

    delete object.encryptedPassword;
    return object;
};

const normalizeString = (value) => {
    if (value === undefined || value === null) {
        return value;
    }

    return String(value).trim();
};

const parseRequiredDate = (value, fieldName) => {
    const parsedDate = new Date(value);
    if (Number.isNaN(parsedDate.getTime())) {
        throw new Error(`${fieldName} must be a valid date`);
    }

    return parsedDate;
};

const getStudentDocument = async (studentId) => {
    const query = Student.findById(studentId).select('-encryptedPassword');
    STUDENT_POPULATION.forEach((population) => query.populate(population));
    return query;
};

const getStudentOrThrow = async (studentId) => {
    const student = await getStudentDocument(studentId);
    if (!student) {
        throw new Error('Student not found');
    }

    return student;
};

const findManagerForStudent = async (student, preferredManagerId = null) => {
    const floorId = student.room_id?.floor_id?._id || student.room_id?.floor_id || null;

    if (preferredManagerId) {
        const manager = await Manager.findById(preferredManagerId).select('-encryptedPassword');
        if (!manager) {
            throw new Error('Manager not found');
        }

        if (
            floorId
            && Array.isArray(manager.assigned_floor_ids)
            && manager.assigned_floor_ids.length > 0
            && !manager.assigned_floor_ids.some((assignedFloorId) => String(assignedFloorId) === String(floorId))
        ) {
            throw new Error('Selected manager is not assigned to the student floor');
        }

        return manager;
    }

    if (floorId) {
        const assignedManager = await Manager.findOne({ assigned_floor_ids: floorId })
            .select('-encryptedPassword')
            .sort({ createdAt: 1 });

        if (assignedManager) {
            return assignedManager;
        }
    }

    const sharedScopeManager = await Manager.findOne({
        $or: [
            { assigned_floor_ids: { $exists: false } },
            { assigned_floor_ids: { $size: 0 } },
        ],
    })
        .select('-encryptedPassword')
        .sort({ createdAt: 1 });

    if (sharedScopeManager) {
        return sharedScopeManager;
    }

    const fallbackManager = await Manager.findOne().select('-encryptedPassword').sort({ createdAt: 1 });
    if (!fallbackManager) {
        throw new Error('No manager is available to handle this request');
    }

    return fallbackManager;
};

const buildRoomAssignment = async (studentId) => {
    const student = await getStudentOrThrow(studentId);
    const manager = await findManagerForStudent(student).catch(() => null);

    return {
        student: {
            _id: student._id,
            name: student.name,
            email: student.email,
            phone: student.phone || null,
            status: student.status,
            hostel_status: student.hostel_status,
            check_in_date: student.check_in_date,
            check_out_date: student.check_out_date,
        },
        assignment: student.room_id
            ? {
                room: student.room_id,
                bed: student.bed_id || null,
                manager: manager ? sanitizeDocument(manager) : null,
            }
            : null,
        allocation_state: {
            room_allotted: Boolean(student.room_id && student.bed_id),
            checked_in: student.hostel_status === 'CHECKED_IN',
        },
        check_in_meta: {
            checked_in_by: student.checked_in_by || null,
            checked_out_by: student.checked_out_by || null,
        },
    };
};

const getProfile = async (studentId) => {
    const student = await getStudentOrThrow(studentId);
    return sanitizeDocument(student);
};

const updateProfile = async (studentId, payload) => {
    const allowedFields = ['name', 'phone'];
    const updates = {};

    allowedFields.forEach((field) => {
        if (payload[field] !== undefined) {
            updates[field] = normalizeString(payload[field]);
        }
    });

    if (!Object.keys(updates).length) {
        throw new Error('At least one profile field is required');
    }

    const student = await Student.findByIdAndUpdate(
        studentId,
        updates,
        { new: true }
    ).select('-encryptedPassword');

    if (!student) {
        throw new Error('Student not found');
    }

    return sanitizeDocument(student);
};

const getDashboard = async (studentId) => {
    const student = await getStudentOrThrow(studentId);

    const [
        leaveTotal,
        leavePending,
        leaveApproved,
        leaveRejected,
        complaintTotal,
        complaintOpen,
        complaintInProgress,
        complaintResolved,
        feeRecords,
        recentNotifications,
    ] = await Promise.all([
        LeaveRequest.countDocuments({ student_id: studentId }),
        LeaveRequest.countDocuments({ student_id: studentId, status: 'PENDING' }),
        LeaveRequest.countDocuments({ student_id: studentId, status: 'APPROVED' }),
        LeaveRequest.countDocuments({ student_id: studentId, status: 'REJECTED' }),
        Complaint.countDocuments({ student_id: studentId }),
        Complaint.countDocuments({ student_id: studentId, status: 'OPEN' }),
        Complaint.countDocuments({ student_id: studentId, status: 'IN_PROGRESS' }),
        Complaint.countDocuments({ student_id: studentId, status: 'RESOLVED' }),
        FeePayment.find({ student_id: studentId }).sort({ year: -1, createdAt: -1 }),
        Notification.find({
            $or: [
                { student_id: studentId },
                { recipient_role: 'STUDENT' },
                { recipient_role: 'ALL' },
            ],
        })
            .sort({ createdAt: -1 })
            .limit(5)
            .lean(),
    ]);

    const feeSummary = feeRecords.reduce((accumulator, record) => {
        accumulator.total_records += 1;
        accumulator.total_amount += record.amount;
        accumulator[record.status.toLowerCase()] += 1;
        accumulator[`${record.status.toLowerCase()}_amount`] += record.amount;
        return accumulator;
    }, {
        total_records: 0,
        total_amount: 0,
        paid: 0,
        pending: 0,
        overdue: 0,
        paid_amount: 0,
        pending_amount: 0,
        overdue_amount: 0,
    });

    return {
        student: sanitizeDocument(student),
        room_assignment: {
            room_allotted: Boolean(student.room_id && student.bed_id),
            room: student.room_id || null,
            bed: student.bed_id || null,
            hostel_status: student.hostel_status,
        },
        leave_requests: {
            total: leaveTotal,
            pending: leavePending,
            approved: leaveApproved,
            rejected: leaveRejected,
        },
        complaints: {
            total: complaintTotal,
            open: complaintOpen,
            in_progress: complaintInProgress,
            resolved: complaintResolved,
        },
        fees: feeSummary,
        recent_notifications: recentNotifications,
    };
};

const getLeaveRequests = async (studentId, filters = {}) => {
    const query = { student_id: studentId };

    if (filters.leave_request_id) {
        query._id = filters.leave_request_id;
    }

    if (filters.status) {
        query.status = String(filters.status).trim().toUpperCase();
    }

    const leaveRequests = await LeaveRequest.find(query)
        .populate('manager_id', 'name email phone building_name')
        .sort({ createdAt: -1 });

    return leaveRequests;
};

const submitLeaveRequest = async (studentId, payload) => {
    const { leave_from, leave_to, reason, manager_id } = payload;

    if (!leave_from || !leave_to || !reason) {
        throw new Error('leave_from, leave_to and reason are required');
    }

    const leaveFrom = parseRequiredDate(leave_from, 'leave_from');
    const leaveTo = parseRequiredDate(leave_to, 'leave_to');
    if (leaveTo < leaveFrom) {
        throw new Error('leave_to cannot be earlier than leave_from');
    }

    const normalizedReason = normalizeString(reason);
    if (!normalizedReason) {
        throw new Error('reason cannot be empty');
    }

    const student = await getStudentOrThrow(studentId);
    const manager = await findManagerForStudent(student, manager_id);

    const overlappingRequest = await LeaveRequest.findOne({
        student_id: studentId,
        status: { $in: ['PENDING', 'APPROVED'] },
        leave_from: { $lte: leaveTo },
        leave_to: { $gte: leaveFrom },
    });

    if (overlappingRequest) {
        throw new Error('A leave request already exists for the selected dates');
    }

    const leaveRequest = await LeaveRequest.create({
        student_id: studentId,
        manager_id: manager._id,
        leave_from: leaveFrom,
        leave_to: leaveTo,
        reason: normalizedReason,
    });

    await notificationService.createRoleNotification({
        title: 'New leave request submitted',
        message: `${student.name} submitted a leave request from ${leaveFrom.toDateString()} to ${leaveTo.toDateString()}.`,
        type: 'LEAVE_REQUEST',
        recipient_role: 'MANAGER',
        student_id: student._id,
        room_number: student.room_id?.room_number || null,
        floor_number: student.room_id?.floor_id?.floor_number || null,
    });

    return LeaveRequest.findById(leaveRequest._id)
        .populate('student_id', 'name email phone status hostel_status')
        .populate('manager_id', 'name email phone building_name');
};

const getComplaints = async (studentId, filters = {}) => {
    const query = { student_id: studentId };

    if (filters.complaint_id) {
        query._id = filters.complaint_id;
    }

    if (filters.status) {
        query.status = String(filters.status).trim().toUpperCase();
    }

    if (filters.category) {
        query.category = String(filters.category).trim().toUpperCase();
    }

    const complaints = await Complaint.find(query)
        .populate('manager_id', 'name email phone building_name')
        .sort({ createdAt: -1 });

    return complaints;
};

const submitComplaint = async (studentId, payload) => {
    const { title, description, category = 'OTHER', manager_id } = payload;

    const normalizedTitle = normalizeString(title);
    const normalizedDescription = normalizeString(description);
    const normalizedCategory = String(category || 'OTHER').trim().toUpperCase();

    if (!normalizedTitle || !normalizedDescription) {
        throw new Error('title and description are required');
    }

    if (!['MAINTENANCE', 'CLEANLINESS', 'NOISE', 'OTHER'].includes(normalizedCategory)) {
        throw new Error('Invalid complaint category');
    }

    const student = await getStudentOrThrow(studentId);
    const manager = await findManagerForStudent(student, manager_id);

    const complaint = await Complaint.create({
        student_id: studentId,
        manager_id: manager._id,
        title: normalizedTitle,
        description: normalizedDescription,
        category: normalizedCategory,
    });

    await notificationService.createRoleNotification({
        title: 'New student complaint submitted',
        message: `${student.name} raised a ${normalizedCategory.toLowerCase()} complaint: ${normalizedTitle}.`,
        type: 'COMPLAINT',
        recipient_role: 'MANAGER',
        student_id: student._id,
        room_number: student.room_id?.room_number || null,
        floor_number: student.room_id?.floor_id?.floor_number || null,
    });

    return Complaint.findById(complaint._id)
        .populate('student_id', 'name email phone status hostel_status')
        .populate('manager_id', 'name email phone building_name');
};

const getFeeStatus = async (studentId, filters = {}) => {
    const query = { student_id: studentId };

    if (filters.status) {
        query.status = String(filters.status).trim().toUpperCase();
    }

    if (filters.year !== undefined) {
        query.year = Number(filters.year);
    }

    if (filters.month) {
        query.month = normalizeString(filters.month);
    }

    const feePayments = await FeePayment.find(query)
        .sort({ year: -1, createdAt: -1 });

    const summary = feePayments.reduce((accumulator, record) => {
        accumulator.total_records += 1;
        accumulator.total_amount += record.amount;
        accumulator[record.status.toLowerCase()] += 1;
        accumulator[`${record.status.toLowerCase()}_amount`] += record.amount;
        return accumulator;
    }, {
        total_records: 0,
        total_amount: 0,
        paid: 0,
        pending: 0,
        overdue: 0,
        paid_amount: 0,
        pending_amount: 0,
        overdue_amount: 0,
    });

    return {
        summary,
        payments: feePayments,
    };
};

const getHostelPolicies = async (filters = {}) => {
    let policies = hostelPolicies.policies;

    if (filters.policy_id) {
        policies = policies.filter((policy) => policy.id === String(filters.policy_id).trim());
    }

    if (filters.category) {
        const category = String(filters.category).trim().toUpperCase();
        policies = policies.filter((policy) => policy.category === category);
    }

    if (filters.search) {
        const searchTerm = String(filters.search).trim().toLowerCase();
        policies = policies.filter((policy) => (
            policy.title.toLowerCase().includes(searchTerm)
            || policy.description.toLowerCase().includes(searchTerm)
            || policy.category.toLowerCase().includes(searchTerm)
        ));
    }

    return {
        version: hostelPolicies.version,
        effective_from: hostelPolicies.effective_from,
        total: policies.length,
        policies,
    };
};

module.exports = {
    getProfile,
    updateProfile,
    getDashboard,
    buildRoomAssignment,
    getLeaveRequests,
    submitLeaveRequest,
    getComplaints,
    submitComplaint,
    getFeeStatus,
    getHostelPolicies,
};
