const Admin = require('../models/admin.model');
const Manager = require('../models/manager.model');
const Student = require('../models/student.model');
const Parent = require('../models/parent.model');
const ParentCommunication = require('../models/parentCommunication.model');
const Complaint = require('../models/complaint.model');
const LeaveRequest = require('../models/leaveRequest.model');
const FeePayment = require('../models/feePayment.model');
const Notification = require('../models/notification.model');
const Attendance = require('../models/attendance.model');
const { encryptData } = require('../utils/encryption');
const {
    normalizeEmergencyContacts,
    normalizeLinkedStudentIds,
    normalizeOptionalText,
} = require('../utils/parentProfile');
const floorService = require('./floor.service');
const roomService = require('./room.service');
const notificationService = require('./notification.service');

const USER_MODELS = [Admin, Manager, Student, Parent];

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

const sanitizeDocuments = (documents) => documents.map(sanitizeDocument);

const getManagerDetails = async (managerId) => sanitizeDocument(
    await Manager.findById(managerId)
        .select('-encryptedPassword')
        .populate('assigned_floor_ids', 'floor_number status total_capacity')
);

const getParentDetails = async (parentId) => sanitizeDocument(
    await Parent.findById(parentId)
        .select('-encryptedPassword')
        .populate({
            path: 'student_ids',
            select: 'name email phone status hostel_status room_id bed_id',
            populate: [
                {
                    path: 'room_id',
                    select: 'room_number status floor_id',
                    populate: {
                        path: 'floor_id',
                        select: 'floor_number status',
                    },
                },
                {
                    path: 'bed_id',
                    select: 'bed_number is_occupied',
                },
            ],
        })
);

const ensureUniqueEmail = async (email, currentId = null) => {
    const normalizedEmail = String(email || '').trim().toLowerCase();
    if (!normalizedEmail) {
        throw new Error('email is required');
    }

    const matches = await Promise.all(
        USER_MODELS.map((Model) => Model.findOne({ email: normalizedEmail }).select('_id'))
    );

    const conflict = matches.find((match) => match && String(match._id) !== String(currentId || ''));
    if (conflict) {
        throw new Error('Email already exists');
    }

    return normalizedEmail;
};

const ensureStudentsExist = async (studentIds) => {
    if (!studentIds || !studentIds.length) {
        return [];
    }

    const count = await Student.countDocuments({ _id: { $in: studentIds } });
    if (count !== studentIds.length) {
        throw new Error('One or more student_ids are invalid');
    }

    return studentIds;
};

const prepareParentPayload = async (payload = {}) => {
    const nextPayload = { ...payload };

    if (nextPayload.relationship !== undefined) {
        nextPayload.relationship = normalizeOptionalText(nextPayload.relationship, 'relationship');
    }

    if (nextPayload.address !== undefined) {
        nextPayload.address = normalizeOptionalText(nextPayload.address, 'address');
    }

    if (nextPayload.emergency_contacts !== undefined) {
        nextPayload.emergency_contacts = normalizeEmergencyContacts(nextPayload.emergency_contacts);
    }

    const linkedStudentIds = normalizeLinkedStudentIds(nextPayload);
    delete nextPayload.student_id;
    if (linkedStudentIds !== undefined) {
        nextPayload.student_ids = await ensureStudentsExist(linkedStudentIds);
    }

    return nextPayload;
};

const createUser = async (Model, role, payload) => {
    const { name, email, password, phone = null, ...rest } = payload;
    if (!name || !email || !password) {
        throw new Error('name, email and password are required');
    }

    const normalizedEmail = await ensureUniqueEmail(email);
    const user = await Model.create({
        ...rest,
        name,
        email: normalizedEmail,
        phone,
        encryptedPassword: encryptData({ password }),
        role,
    });

    return sanitizeDocument(user);
};

const updateUser = async (Model, id, payload, label) => {
    if (!id) {
        throw new Error(`${label}_id is required`);
    }

    const user = await Model.findById(id);
    if (!user) {
        throw new Error(`${label} not found`);
    }

    const updateData = { ...payload };
    delete updateData.role;
    delete updateData.encryptedPassword;
    delete updateData._id;
    delete updateData.createdAt;
    delete updateData.updatedAt;

    if (updateData.email !== undefined) {
        user.email = await ensureUniqueEmail(updateData.email, user._id);
        delete updateData.email;
    }

    if (updateData.password !== undefined) {
        if (!updateData.password) {
            throw new Error('password cannot be empty');
        }

        user.encryptedPassword = encryptData({ password: updateData.password });
        delete updateData.password;
    }

    Object.entries(updateData).forEach(([key, value]) => {
        if (value !== undefined) {
            user[key] = value;
        }
    });

    await user.save();
    return sanitizeDocument(user);
};

const parseAmount = (value, fieldName = 'amount') => {
    const amount = Number(value);
    if (Number.isNaN(amount) || amount < 0) {
        throw new Error(`${fieldName} must be a non-negative number`);
    }

    return amount;
};

const parseYear = (value) => {
    const year = Number(value);
    if (!Number.isInteger(year) || year <= 0) {
        throw new Error('year must be a positive integer');
    }

    return year;
};

const parseDate = (value, fieldName) => {
    if (!value) {
        return null;
    }

    const parsedDate = new Date(value);
    if (Number.isNaN(parsedDate.getTime())) {
        throw new Error(`${fieldName} must be a valid date`);
    }

    return parsedDate;
};

const getProfile = async (adminId) => sanitizeDocument(
    await Admin.findById(adminId).select('-encryptedPassword')
);

const getAllManagers = async () => sanitizeDocuments(
    await Manager.find()
        .select('-encryptedPassword')
        .populate('assigned_floor_ids', 'floor_number status total_capacity')
        .sort({ createdAt: -1 })
);

const getAllStudents = async () => sanitizeDocuments(
    await Student.find()
        .select('-encryptedPassword')
        .populate({ path: 'room_id', select: 'room_number status floor_id', populate: { path: 'floor_id', select: 'floor_number status' } })
        .populate('bed_id', 'bed_number is_occupied')
        .sort({ createdAt: -1 })
);

const getAllParents = async () => sanitizeDocuments(
    await Parent.find()
        .select('-encryptedPassword')
        .populate({
            path: 'student_ids',
            select: 'name email phone status hostel_status room_id bed_id',
            populate: [
                {
                    path: 'room_id',
                    select: 'room_number status floor_id',
                    populate: {
                        path: 'floor_id',
                        select: 'floor_number status',
                    },
                },
                {
                    path: 'bed_id',
                    select: 'bed_number is_occupied',
                },
            ],
        })
        .sort({ createdAt: -1 })
);

const createManager = async (payload) => {
    const manager = await createUser(Manager, 'MANAGER', payload);
    return getManagerDetails(manager._id);
};
const createStudent = async (payload) => createUser(Student, 'STUDENT', payload);
const createParent = async (payload) => {
    const parent = await createUser(Parent, 'PARENT', await prepareParentPayload(payload));
    return getParentDetails(parent._id);
};

const updateManager = async ({ manager_id, ...payload }) => {
    const manager = await updateUser(Manager, manager_id, payload, 'manager');
    return getManagerDetails(manager._id);
};
const updateStudent = async ({ student_id, ...payload }) => updateUser(Student, student_id, payload, 'student');
const updateParent = async ({ parent_id, ...payload }) => {
    const parent = await updateUser(Parent, parent_id, await prepareParentPayload(payload), 'parent');
    return getParentDetails(parent._id);
};

const deleteManager = async ({ manager_id }) => {
    if (!manager_id) {
        throw new Error('manager_id is required');
    }

    const manager = await Manager.findById(manager_id);
    if (!manager) {
        throw new Error('Manager not found');
    }

    const [leaveRequestsCount, complaintsCount, attendanceCount] = await Promise.all([
        LeaveRequest.countDocuments({ manager_id }),
        Complaint.countDocuments({ manager_id }),
        Attendance.countDocuments({ manager_id }),
    ]);

    if (leaveRequestsCount > 0 || complaintsCount > 0 || attendanceCount > 0) {
        throw new Error('Cannot delete manager with assigned leave requests, complaints or attendance history');
    }

    await manager.deleteOne();
    return sanitizeDocument(manager);
};

const deleteStudent = async ({ student_id }) => {
    if (!student_id) {
        throw new Error('student_id is required');
    }

    const student = await Student.findById(student_id);
    if (!student) {
        throw new Error('Student not found');
    }

    if (student.status === 'ALLOTTED' && student.room_id && student.bed_id) {
        await roomService.unassignRoom(student_id);
    }

    await Promise.all([
        LeaveRequest.deleteMany({ student_id }),
        Complaint.deleteMany({ student_id }),
        FeePayment.deleteMany({ student_id }),
        Notification.deleteMany({ student_id }),
        Attendance.deleteMany({ student_id }),
        ParentCommunication.deleteMany({ student_id }),
        Parent.updateMany({ student_ids: student._id }, { $pull: { student_ids: student._id } }),
    ]);

    await student.deleteOne();
    return sanitizeDocument(student);
};

const deleteParent = async ({ parent_id }) => {
    if (!parent_id) {
        throw new Error('parent_id is required');
    }

    const parent = await Parent.findById(parent_id);
    if (!parent) {
        throw new Error('Parent not found');
    }

    await ParentCommunication.deleteMany({ parent_id });
    await parent.deleteOne();
    return sanitizeDocument(parent);
};

const getAllFloors = async () => floorService.getAllFloors();

const createFloor = async ({ floor_number, room_count, beds_per_room }) => floorService.createFloor(
    floor_number,
    { room_count, beds_per_room }
);

const updateFloor = async ({ floor_id, ...payload }) => {
    if (!floor_id) {
        throw new Error('floor_id is required');
    }

    return floorService.updateFloor(floor_id, payload);
};

const deleteFloor = async ({ floor_id }) => {
    if (!floor_id) {
        throw new Error('floor_id is required');
    }

    return floorService.deleteFloor(floor_id);
};

const getAllRooms = async () => roomService.getAllRooms();
const getAvailableRooms = async () => roomService.getAvailableRooms();

const createRoom = async ({ floor_id, room_number, total_beds }) => roomService.createRoom(
    floor_id,
    room_number,
    total_beds
);

const updateRoom = async ({ room_id, ...payload }) => {
    if (!room_id) {
        throw new Error('room_id is required');
    }

    return roomService.updateRoom(room_id, payload);
};

const deleteRoom = async ({ room_id }) => {
    if (!room_id) {
        throw new Error('room_id is required');
    }

    return roomService.deleteRoom(room_id);
};

const assignRoom = async ({ student_id, room_id }) => {
    if (!student_id || !room_id) {
        throw new Error('student_id and room_id are required');
    }

    return roomService.assignRoom(student_id, room_id);
};

const unassignRoom = async ({ student_id }) => {
    if (!student_id) {
        throw new Error('student_id is required');
    }

    return roomService.unassignRoom(student_id);
};

const getFeeSummary = async () => {
    const [
        totalRecords,
        paidRecords,
        pendingRecords,
        overdueRecords,
        collectedAmount,
        pendingAmount,
    ] = await Promise.all([
        FeePayment.countDocuments(),
        FeePayment.countDocuments({ status: 'PAID' }),
        FeePayment.countDocuments({ status: 'PENDING' }),
        FeePayment.countDocuments({ status: 'OVERDUE' }),
        FeePayment.aggregate([
            { $match: { status: 'PAID' } },
            { $group: { _id: null, total: { $sum: '$amount' } } },
        ]),
        FeePayment.aggregate([
            { $match: { status: { $in: ['PENDING', 'OVERDUE'] } } },
            { $group: { _id: null, total: { $sum: '$amount' } } },
        ]),
    ]);

    return {
        total_records: totalRecords,
        paid: paidRecords,
        pending: pendingRecords,
        overdue: overdueRecords,
        collected_amount: collectedAmount[0]?.total || 0,
        pending_amount: pendingAmount[0]?.total || 0,
    };
};

const getFeePayments = async () => {
    const [summary, records] = await Promise.all([
        getFeeSummary(),
        FeePayment.find()
            .populate('student_id', 'name email status')
            .sort({ year: -1, createdAt: -1 }),
    ]);

    return { summary, records };
};

const recordFeePayment = async ({
    student_id,
    amount,
    month,
    year,
    payment_method = null,
    transaction_id = null,
    status = 'PAID',
    payment_date = null,
}) => {
    if (!student_id || !month || year === undefined) {
        throw new Error('student_id, month and year are required');
    }

    const student = await Student.findById(student_id);
    if (!student) {
        throw new Error('Student not found');
    }

    const normalizedAmount = parseAmount(amount);
    const normalizedYear = parseYear(year);
    const normalizedMonth = String(month || '').trim();
    if (!normalizedMonth) {
        throw new Error('month is required');
    }

    const normalizedStatus = String(status || 'PAID').trim().toUpperCase();
    if (!['PENDING', 'PAID', 'OVERDUE'].includes(normalizedStatus)) {
        throw new Error('status must be PENDING, PAID or OVERDUE');
    }

    const explicitPaymentDate = parseDate(payment_date, 'payment_date');
    const nextPaymentDate = normalizedStatus === 'PAID'
        ? (explicitPaymentDate || new Date())
        : explicitPaymentDate;

    return FeePayment.findOneAndUpdate(
        { student_id, month: normalizedMonth, year: normalizedYear },
        {
            amount: normalizedAmount,
            month: normalizedMonth,
            year: normalizedYear,
            status: normalizedStatus,
            payment_method,
            transaction_id,
            payment_date: nextPaymentDate,
        },
        { new: true, upsert: true }
    ).populate('student_id', 'name email status');
};

const getNotifications = async (limit) => notificationService.getAllNotifications({ limit });

const createNotification = async ({
    title,
    message,
    type = 'ANNOUNCEMENT',
    recipient_role = 'ALL',
    student_id = null,
    room_number = null,
    floor_number = null,
}, adminId) => {
    if (!title || !message) {
        throw new Error('title and message are required');
    }

    return notificationService.createAdminNotification({
        title,
        message,
        type,
        recipient_role: String(recipient_role || 'ALL').trim().toUpperCase(),
        student_id,
        room_number,
        floor_number,
        created_by: adminId,
    });
};

const deleteNotification = async ({ notification_id }) => {
    if (!notification_id) {
        throw new Error('notification_id is required');
    }

    const notification = await notificationService.deleteNotification(notification_id);
    if (!notification) {
        throw new Error('Notification not found');
    }

    return notification;
};

const getDashboard = async () => {
    const [
        baseStats,
        adminCount,
        totalLeaveRequests,
        pendingLeaveRequests,
        approvedLeaveRequests,
        rejectedLeaveRequests,
        totalComplaints,
        openComplaints,
        inProgressComplaints,
        resolvedComplaints,
        feeSummary,
        recentNotifications,
    ] = await Promise.all([
        roomService.getDashboardStats(),
        Admin.countDocuments(),
        LeaveRequest.countDocuments(),
        LeaveRequest.countDocuments({ status: 'PENDING' }),
        LeaveRequest.countDocuments({ status: 'APPROVED' }),
        LeaveRequest.countDocuments({ status: 'REJECTED' }),
        Complaint.countDocuments(),
        Complaint.countDocuments({ status: 'OPEN' }),
        Complaint.countDocuments({ status: 'IN_PROGRESS' }),
        Complaint.countDocuments({ status: 'RESOLVED' }),
        getFeeSummary(),
        notificationService.getAllNotifications({ limit: 5 }),
    ]);

    return {
        users: {
            admins: adminCount,
            managers: baseStats.managers.total,
            students: baseStats.students.total,
            parents: baseStats.parents.total,
        },
        students: baseStats.students,
        occupancy: {
            floors: baseStats.floors,
            rooms: baseStats.rooms,
            beds: baseStats.beds,
        },
        operations: {
            leave_requests: {
                total: totalLeaveRequests,
                pending: pendingLeaveRequests,
                approved: approvedLeaveRequests,
                rejected: rejectedLeaveRequests,
            },
            complaints: {
                total: totalComplaints,
                open: openComplaints,
                in_progress: inProgressComplaints,
                resolved: resolvedComplaints,
            },
            fees: feeSummary,
        },
        recent_notifications: recentNotifications,
    };
};

module.exports = {
    getProfile,
    getDashboard,
    getAllManagers,
    getAllStudents,
    getAllParents,
    createManager,
    updateManager,
    deleteManager,
    createStudent,
    updateStudent,
    deleteStudent,
    createParent,
    updateParent,
    deleteParent,
    getAllFloors,
    createFloor,
    updateFloor,
    deleteFloor,
    getAllRooms,
    getAvailableRooms,
    createRoom,
    updateRoom,
    deleteRoom,
    assignRoom,
    unassignRoom,
    getFeePayments,
    recordFeePayment,
    getNotifications,
    createNotification,
    deleteNotification,
};
