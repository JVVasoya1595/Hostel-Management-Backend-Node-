const Parent = require('../models/parent.model');
const Student = require('../models/student.model');
const Manager = require('../models/manager.model');
const Complaint = require('../models/complaint.model');
const FeePayment = require('../models/feePayment.model');
const Notification = require('../models/notification.model');
const LeaveRequest = require('../models/leaveRequest.model');
const ParentCommunication = require('../models/parentCommunication.model');
const notificationService = require('./notification.service');
const {
    normalizeEmergencyContacts,
    normalizeOptionalText,
    normalizeRequiredText,
} = require('../utils/parentProfile');

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

const populateStudentQuery = (query) => {
    STUDENT_POPULATION.forEach((population) => query.populate(population));
    return query;
};

const toIdString = (value) => String(value);

const buildLatestRecordMap = (records, idGetter) => records.reduce((accumulator, record) => {
    const key = toIdString(idGetter(record));
    if (!accumulator[key]) {
        accumulator[key] = record;
    }

    return accumulator;
}, {});

const getAssignedManagerMap = async (students) => {
    const floorIds = [...new Set(
        students
            .map((student) => student.room_id?.floor_id?._id || student.room_id?.floor_id)
            .filter(Boolean)
            .map(toIdString)
    )];

    if (!floorIds.length) {
        return {};
    }

    const managers = await Manager.find({ assigned_floor_ids: { $in: floorIds } })
        .select('-encryptedPassword')
        .populate('assigned_floor_ids', 'floor_number status')
        .sort({ createdAt: 1 });

    return managers.reduce((accumulator, manager) => {
        (manager.assigned_floor_ids || []).forEach((floor) => {
            const floorId = toIdString(floor._id || floor);
            if (!accumulator[floorId]) {
                accumulator[floorId] = sanitizeDocument(manager);
            }
        });

        return accumulator;
    }, {});
};

const buildStudentView = (student, managerByFloorId = {}) => {
    const safeStudent = sanitizeDocument(student);
    const floorId = safeStudent.room_id?.floor_id?._id || safeStudent.room_id?.floor_id || null;

    return {
        ...safeStudent,
        assigned_manager: floorId ? (managerByFloorId[toIdString(floorId)] || null) : null,
    };
};

const getParentScope = async (parentId) => {
    const parent = await Parent.findById(parentId).select('-encryptedPassword');
    if (!parent) {
        throw new Error('Parent not found');
    }

    const studentIds = (parent.student_ids || []).map(toIdString);
    const students = studentIds.length
        ? await populateStudentQuery(
            Student.find({ _id: { $in: studentIds } })
                .select('-encryptedPassword')
                .sort({ name: 1 })
        )
        : [];
    const managerByFloorId = await getAssignedManagerMap(students);

    return {
        parent,
        studentIds,
        students,
        managerByFloorId,
    };
};

const resolveAccessibleStudentIds = (scope, studentId = null) => {
    if (!studentId) {
        return scope.studentIds;
    }

    const normalizedStudentId = toIdString(studentId);
    if (!scope.studentIds.includes(normalizedStudentId)) {
        throw new Error('Student is not linked to this parent');
    }

    return [normalizedStudentId];
};

const getAccessibleStudents = (scope, studentId = null) => {
    const accessibleStudentIds = resolveAccessibleStudentIds(scope, studentId);
    return scope.students.filter((student) => accessibleStudentIds.includes(toIdString(student._id)));
};

const findAssignedManagerForStudent = async (student) => {
    const floorId = student.room_id?.floor_id?._id || student.room_id?.floor_id;
    if (!floorId) {
        return null;
    }

    return Manager.findOne({ assigned_floor_ids: floorId })
        .select('-encryptedPassword')
        .sort({ createdAt: 1 });
};

const getProfile = async (parentId) => {
    const scope = await getParentScope(parentId);

    return {
        ...sanitizeDocument(scope.parent),
        linked_students: scope.students.map((student) => ({
            _id: student._id,
            name: student.name,
            email: student.email,
            status: student.status,
            hostel_status: student.hostel_status,
        })),
    };
};

const updateProfile = async (parentId, payload) => {
    const updates = {};

    ['name', 'phone', 'relationship', 'address'].forEach((field) => {
        if (payload[field] !== undefined) {
            updates[field] = normalizeOptionalText(payload[field], field);
        }
    });

    if (!Object.keys(updates).length) {
        throw new Error('At least one profile field is required');
    }

    const parent = await Parent.findByIdAndUpdate(parentId, updates, { new: true }).select('-encryptedPassword');
    if (!parent) {
        throw new Error('Parent not found');
    }

    return getProfile(parent._id);
};

const getDashboard = async (parentId) => {
    const scope = await getParentScope(parentId);
    const accessibleStudentIds = scope.studentIds;

    const [
        complaints,
        feePayments,
        leaveRequests,
        communications,
        recentNotifications,
    ] = await Promise.all([
        accessibleStudentIds.length
            ? Complaint.find({ student_id: { $in: accessibleStudentIds } })
            : [],
        accessibleStudentIds.length
            ? FeePayment.find({ student_id: { $in: accessibleStudentIds } }).sort({ year: -1, payment_date: -1, createdAt: -1 })
            : [],
        accessibleStudentIds.length
            ? LeaveRequest.find({ student_id: { $in: accessibleStudentIds } }).sort({ createdAt: -1 })
            : [],
        ParentCommunication.find({ parent_id: parentId }).sort({ createdAt: -1 }),
        Notification.find({
            $or: [
                { recipient_role: 'PARENT' },
                { recipient_role: 'ALL' },
                ...(accessibleStudentIds.length ? [{ student_id: { $in: accessibleStudentIds } }] : []),
            ],
        })
            .populate('student_id', 'name email')
            .sort({ createdAt: -1 })
            .limit(5),
    ]);

    const feeSummary = feePayments.reduce((accumulator, record) => {
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

    const complaintSummary = complaints.reduce((accumulator, complaint) => {
        accumulator.total += 1;
        accumulator[complaint.status.toLowerCase()] += 1;
        return accumulator;
    }, {
        total: 0,
        open: 0,
        in_progress: 0,
        resolved: 0,
        closed: 0,
    });

    const communicationSummary = communications.reduce((accumulator, communication) => {
        accumulator.total += 1;
        accumulator[communication.status.toLowerCase()] += 1;
        return accumulator;
    }, {
        total: 0,
        open: 0,
        in_progress: 0,
        closed: 0,
    });

    const latestLeaveByStudent = buildLatestRecordMap(leaveRequests, (record) => record.student_id);
    const latestFeeByStudent = buildLatestRecordMap(feePayments, (record) => record.student_id);

    const students = scope.students.map((student) => {
        const safeStudent = buildStudentView(student, scope.managerByFloorId);
        return {
            ...safeStudent,
            latest_leave_request: latestLeaveByStudent[toIdString(student._id)] || null,
            latest_fee_record: latestFeeByStudent[toIdString(student._id)] || null,
        };
    });

    return {
        parent: sanitizeDocument(scope.parent),
        students_summary: {
            total: scope.students.length,
            allotted: scope.students.filter((student) => student.status === 'ALLOTTED').length,
            pending_allocation: scope.students.filter((student) => student.status === 'PENDING').length,
            checked_in: scope.students.filter((student) => student.hostel_status === 'CHECKED_IN').length,
            checked_out: scope.students.filter((student) => student.hostel_status === 'CHECKED_OUT').length,
            not_checked_in: scope.students.filter((student) => student.hostel_status === 'NOT_CHECKED_IN').length,
        },
        complaints: complaintSummary,
        fees: feeSummary,
        communications: communicationSummary,
        recent_notifications: recentNotifications,
        students,
    };
};

const getStudents = async (parentId, filters = {}) => {
    const scope = await getParentScope(parentId);
    const students = getAccessibleStudents(scope, filters.student_id);
    const studentIds = students.map((student) => student._id);

    const [complaints, feePayments, leaveRequests] = await Promise.all([
        studentIds.length
            ? Complaint.find({ student_id: { $in: studentIds } })
            : [],
        studentIds.length
            ? FeePayment.find({ student_id: { $in: studentIds } }).sort({ year: -1, payment_date: -1, createdAt: -1 })
            : [],
        studentIds.length
            ? LeaveRequest.find({ student_id: { $in: studentIds } }).sort({ createdAt: -1 })
            : [],
    ]);

    const complaintSummaryByStudent = complaints.reduce((accumulator, complaint) => {
        const key = toIdString(complaint.student_id);
        if (!accumulator[key]) {
            accumulator[key] = {
                total: 0,
                open: 0,
                in_progress: 0,
                resolved: 0,
                closed: 0,
            };
        }

        accumulator[key].total += 1;
        accumulator[key][complaint.status.toLowerCase()] += 1;
        return accumulator;
    }, {});

    const latestLeaveByStudent = buildLatestRecordMap(leaveRequests, (record) => record.student_id);
    const latestFeeByStudent = buildLatestRecordMap(feePayments, (record) => record.student_id);

    return {
        total: students.length,
        students: students.map((student) => ({
            ...buildStudentView(student, scope.managerByFloorId),
            complaint_summary: complaintSummaryByStudent[toIdString(student._id)] || {
                total: 0,
                open: 0,
                in_progress: 0,
                resolved: 0,
                closed: 0,
            },
            latest_leave_request: latestLeaveByStudent[toIdString(student._id)] || null,
            latest_fee_record: latestFeeByStudent[toIdString(student._id)] || null,
        })),
    };
};

const getFeeHistory = async (parentId, filters = {}) => {
    const scope = await getParentScope(parentId);
    const accessibleStudentIds = resolveAccessibleStudentIds(scope, filters.student_id);
    const query = {
        student_id: { $in: accessibleStudentIds },
    };

    if (filters.status) {
        query.status = String(filters.status).trim().toUpperCase();
    }

    if (filters.year !== undefined) {
        query.year = Number(filters.year);
    }

    if (filters.month) {
        query.month = normalizeRequiredText(filters.month, 'month');
    }

    const payments = await FeePayment.find(query)
        .populate('student_id', 'name email status hostel_status')
        .sort({ year: -1, payment_date: -1, createdAt: -1 });

    const summary = payments.reduce((accumulator, payment) => {
        accumulator.total_records += 1;
        accumulator.total_amount += payment.amount;
        accumulator[payment.status.toLowerCase()] += 1;
        accumulator[`${payment.status.toLowerCase()}_amount`] += payment.amount;
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
        payments,
    };
};

const getComplaints = async (parentId, filters = {}) => {
    const scope = await getParentScope(parentId);
    const accessibleStudentIds = resolveAccessibleStudentIds(scope, filters.student_id);
    const query = {
        student_id: { $in: accessibleStudentIds },
    };

    if (filters.status) {
        query.status = String(filters.status).trim().toUpperCase();
    }

    if (filters.category) {
        query.category = String(filters.category).trim().toUpperCase();
    }

    const complaints = await Complaint.find(query)
        .populate('student_id', 'name email status hostel_status')
        .populate('manager_id', 'name email phone building_name')
        .sort({ createdAt: -1 });

    const summary = complaints.reduce((accumulator, complaint) => {
        accumulator.total += 1;
        accumulator[complaint.status.toLowerCase()] += 1;
        return accumulator;
    }, {
        total: 0,
        open: 0,
        in_progress: 0,
        resolved: 0,
        closed: 0,
    });

    return {
        summary,
        complaints,
    };
};

const getCommunications = async (parentId, filters = {}) => {
    const scope = await getParentScope(parentId);
    const communicationQuery = { parent_id: parentId };
    if (filters.student_id) {
        resolveAccessibleStudentIds(scope, filters.student_id);
        communicationQuery.student_id = filters.student_id;
    }

    if (filters.status) {
        communicationQuery.status = String(filters.status).trim().toUpperCase();
    }

    if (filters.category) {
        communicationQuery.category = String(filters.category).trim().toUpperCase();
    }

    const notificationStudentIds = filters.student_id
        ? resolveAccessibleStudentIds(scope, filters.student_id)
        : scope.studentIds;
    const limit = Number(filters.limit) > 0 ? Number(filters.limit) : 10;

    const [communications, notifications] = await Promise.all([
        ParentCommunication.find(communicationQuery)
            .populate('student_id', 'name email status hostel_status')
            .populate('manager_id', 'name email phone building_name')
            .sort({ createdAt: -1 }),
        Notification.find({
            $or: [
                { recipient_role: 'PARENT' },
                { recipient_role: 'ALL' },
                ...(notificationStudentIds.length ? [{ student_id: { $in: notificationStudentIds } }] : []),
            ],
        })
            .populate('student_id', 'name email')
            .sort({ createdAt: -1 })
            .limit(limit),
    ]);

    const summary = communications.reduce((accumulator, communication) => {
        accumulator.total += 1;
        accumulator[communication.status.toLowerCase()] += 1;
        return accumulator;
    }, {
        total: 0,
        open: 0,
        in_progress: 0,
        closed: 0,
    });

    return {
        summary,
        communications,
        notifications,
    };
};

const createCommunication = async (parentId, payload) => {
    const scope = await getParentScope(parentId);
    const subject = normalizeRequiredText(payload.subject, 'subject');
    const message = normalizeRequiredText(payload.message, 'message');
    const category = String(payload.category || 'GENERAL').trim().toUpperCase();
    const priority = String(payload.priority || 'NORMAL').trim().toUpperCase();

    if (!['GENERAL', 'FEES', 'COMPLAINT', 'LEAVE', 'EMERGENCY'].includes(category)) {
        throw new Error('Invalid communication category');
    }

    if (!['LOW', 'NORMAL', 'HIGH', 'URGENT'].includes(priority)) {
        throw new Error('Invalid communication priority');
    }

    const student = payload.student_id
        ? getAccessibleStudents(scope, payload.student_id)[0]
        : null;
    const assignedManager = student
        ? await findAssignedManagerForStudent(student)
        : null;

    const communication = await ParentCommunication.create({
        parent_id: parentId,
        student_id: student?._id || null,
        manager_id: assignedManager?._id || null,
        subject,
        message,
        category,
        priority,
        status: 'OPEN',
    });

    await notificationService.createRoleNotification({
        title: 'New parent communication received',
        message: `${scope.parent.name} submitted a ${category.toLowerCase()} message${student ? ` regarding ${student.name}` : ''}.`,
        type: 'COMMUNICATION',
        recipient_role: assignedManager ? 'MANAGER' : 'ADMIN',
        student_id: student?._id || null,
        room_number: student?.room_id?.room_number || null,
        floor_number: student?.room_id?.floor_id?.floor_number || null,
    });

    return ParentCommunication.findById(communication._id)
        .populate('student_id', 'name email status hostel_status')
        .populate('manager_id', 'name email phone building_name');
};

const getEmergencyContacts = async (parentId) => {
    const parent = await Parent.findById(parentId).select('-encryptedPassword');
    if (!parent) {
        throw new Error('Parent not found');
    }

    return {
        parent: {
            _id: parent._id,
            name: parent.name,
            phone: parent.phone,
            email: parent.email,
            address: parent.address,
            relationship: parent.relationship,
        },
        emergency_contacts: parent.emergency_contacts || [],
    };
};

const updateEmergencyContacts = async (parentId, payload) => {
    const emergencyContacts = normalizeEmergencyContacts(payload.emergency_contacts);
    if (emergencyContacts === undefined) {
        throw new Error('emergency_contacts is required');
    }

    const parent = await Parent.findByIdAndUpdate(
        parentId,
        { emergency_contacts: emergencyContacts },
        { new: true }
    ).select('-encryptedPassword');

    if (!parent) {
        throw new Error('Parent not found');
    }

    return {
        parent: {
            _id: parent._id,
            name: parent.name,
            phone: parent.phone,
            email: parent.email,
            address: parent.address,
            relationship: parent.relationship,
        },
        emergency_contacts: parent.emergency_contacts || [],
    };
};

module.exports = {
    getProfile,
    updateProfile,
    getDashboard,
    getStudents,
    getFeeHistory,
    getComplaints,
    getCommunications,
    createCommunication,
    getEmergencyContacts,
    updateEmergencyContacts,
};
