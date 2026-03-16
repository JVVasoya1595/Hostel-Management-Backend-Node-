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
const Floor = require('../models/floor.model');
const Room = require('../models/room.model');
const Bed = require('../models/bed.model');
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

const startOfDay = (value) => {
    const date = new Date(value);
    date.setHours(0, 0, 0, 0);
    return date;
};

const endOfDay = (value) => {
    const date = new Date(value);
    date.setHours(23, 59, 59, 999);
    return date;
};

const parseOptionalPositiveInteger = (value, fieldName) => {
    if (value === undefined || value === null || value === '') {
        return null;
    }

    const parsedValue = Number(value);
    if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
        throw new Error(`${fieldName} must be a positive integer`);
    }

    return parsedValue;
};

const normalizeEnum = (value, fieldName, allowedValues) => {
    const normalizedValue = String(value || '').trim().toUpperCase();
    if (!allowedValues.includes(normalizedValue)) {
        throw new Error(`${fieldName} must be one of ${allowedValues.join(', ')}`);
    }

    return normalizedValue;
};

const MONTH_ORDER = {
    JANUARY: 1,
    FEBRUARY: 2,
    MARCH: 3,
    APRIL: 4,
    MAY: 5,
    JUNE: 6,
    JULY: 7,
    AUGUST: 8,
    SEPTEMBER: 9,
    OCTOBER: 10,
    NOVEMBER: 11,
    DECEMBER: 12,
};

const buildSummary = (records, initialState, keyBuilder) => records.reduce((accumulator, record) => {
    accumulator.total += 1;
    const key = keyBuilder(record);
    if (key && Object.prototype.hasOwnProperty.call(accumulator, key)) {
        accumulator[key] += 1;
    }

    return accumulator;
}, { ...initialState });

const getStudentNotificationContext = async (studentId) => {
    const student = await Student.findById(studentId)
        .select('-encryptedPassword')
        .populate({
            path: 'room_id',
            select: 'room_number floor_id',
            populate: {
                path: 'floor_id',
                select: 'floor_number',
            },
        });

    if (!student) {
        throw new Error('Student not found');
    }

    return student;
};

const notifyStudentAndParents = async ({
    student_id,
    title,
    message,
    type,
    created_by = null,
    delivery_channels = ['IN_APP'],
}) => {
    const student = await getStudentNotificationContext(student_id);
    await notificationService.notifyStudentAndParents({
        student,
        title,
        message,
        type,
        created_by,
        delivery_channels,
    });
};

const populateLeaveRequestQuery = (query) => query
    .populate('student_id', 'name email phone status hostel_status room_id bed_id')
    .populate('manager_id', 'name email phone building_name');

const populateComplaintQuery = (query) => query
    .populate('student_id', 'name email phone status hostel_status room_id bed_id')
    .populate('manager_id', 'name email phone building_name');

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

const buildFeeSummaryFromRecords = (records) => records.reduce((accumulator, record) => {
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
    collected_amount: 0,
});

const finalizeFeeSummary = (summary) => ({
    ...summary,
    collected_amount: summary.paid_amount,
    pending_amount: summary.pending_amount + summary.overdue_amount,
});

const buildFeeQuery = (filters = {}) => {
    const query = {};

    if (filters.student_id) {
        query.student_id = filters.student_id;
    }

    if (filters.status) {
        query.status = normalizeEnum(filters.status, 'status', ['PENDING', 'PAID', 'OVERDUE']);
    }

    if (filters.year !== undefined) {
        query.year = parseYear(filters.year);
    }

    if (filters.month) {
        query.month = String(filters.month).trim();
    }

    return query;
};

const getFeeSummary = async (filters = {}) => {
    const records = await FeePayment.find(buildFeeQuery(filters)).lean();
    return finalizeFeeSummary(buildFeeSummaryFromRecords(records));
};

const getFeePayments = async (filters = {}) => {
    const query = buildFeeQuery(filters);
    const records = await FeePayment.find(query)
        .populate('student_id', 'name email status hostel_status')
        .sort({ year: -1, createdAt: -1 });

    return {
        filters: {
            student_id: filters.student_id || null,
            status: filters.status ? String(filters.status).trim().toUpperCase() : null,
            year: filters.year !== undefined ? parseYear(filters.year) : null,
            month: filters.month ? String(filters.month).trim() : null,
        },
        summary: finalizeFeeSummary(buildFeeSummaryFromRecords(records)),
        records,
    };
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

const sendFeeReminder = async ({
    student_id,
    amount,
    month,
    year,
    message = null,
    status = 'OVERDUE',
    delivery_channels = ['IN_APP'],
}, adminId) => {
    if (!student_id || !month || year === undefined) {
        throw new Error('student_id, month and year are required');
    }

    const student = await getStudentNotificationContext(student_id);
    const normalizedYear = parseYear(year);
    const normalizedMonth = String(month || '').trim();
    if (!normalizedMonth) {
        throw new Error('month is required');
    }

    const normalizedStatus = normalizeEnum(status, 'status', ['PENDING', 'OVERDUE']);
    const existingRecord = await FeePayment.findOne({
        student_id,
        month: normalizedMonth,
        year: normalizedYear,
    });

    if (existingRecord?.status === 'PAID') {
        throw new Error('Fee for the selected month is already marked as paid');
    }

    const normalizedAmount = amount !== undefined
        ? parseAmount(amount)
        : existingRecord?.amount;

    if (normalizedAmount === undefined) {
        throw new Error('amount is required when no fee record exists');
    }

    const feePayment = await FeePayment.findOneAndUpdate(
        { student_id, month: normalizedMonth, year: normalizedYear },
        {
            amount: normalizedAmount,
            month: normalizedMonth,
            year: normalizedYear,
            status: normalizedStatus,
            payment_date: null,
        },
        { new: true, upsert: true }
    ).populate('student_id', 'name email status hostel_status');

    const reminderMessage = message
        || `Hostel fee for ${normalizedMonth} ${normalizedYear} is ${normalizedStatus.toLowerCase()}. Amount due: ${normalizedAmount}.`;

    await notificationService.notifyStudentAndParents({
        student,
        title: 'Hostel fee reminder',
        message: reminderMessage,
        type: 'FEE_REMINDER',
        created_by: adminId,
        delivery_channels,
    });

    return {
        fee_payment: feePayment,
        reminder: {
            student_id,
            title: 'Hostel fee reminder',
            message: reminderMessage,
            delivery_channels,
        },
    };
};

const buildLeaveRequestQuery = (filters = {}) => {
    const query = {};

    if (filters.leave_request_id) {
        query._id = filters.leave_request_id;
    }

    if (filters.student_id) {
        query.student_id = filters.student_id;
    }

    if (filters.manager_id) {
        query.manager_id = filters.manager_id;
    }

    if (filters.status) {
        query.status = normalizeEnum(filters.status, 'status', ['PENDING', 'APPROVED', 'REJECTED']);
    }

    const fromDate = parseDate(filters.from_date, 'from_date');
    const toDate = parseDate(filters.to_date, 'to_date');
    if (fromDate) {
        query.leave_to = { ...(query.leave_to || {}), $gte: startOfDay(fromDate) };
    }

    if (toDate) {
        query.leave_from = { ...(query.leave_from || {}), $lte: endOfDay(toDate) };
    }

    return query;
};

const getLeaveRequests = async (filters = {}) => {
    const leaveRequests = await populateLeaveRequestQuery(
        LeaveRequest.find(buildLeaveRequestQuery(filters)).sort({ createdAt: -1 })
    );

    return {
        filters: {
            leave_request_id: filters.leave_request_id || null,
            student_id: filters.student_id || null,
            manager_id: filters.manager_id || null,
            status: filters.status ? String(filters.status).trim().toUpperCase() : null,
            from_date: filters.from_date || null,
            to_date: filters.to_date || null,
        },
        summary: buildSummary(
            leaveRequests,
            { total: 0, pending: 0, approved: 0, rejected: 0 },
            (record) => record.status.toLowerCase()
        ),
        leave_requests: leaveRequests,
    };
};

const updateLeaveRequest = async ({
    leave_request_id,
    status,
    remarks,
    delivery_channels = ['IN_APP'],
}, adminId) => {
    if (!leave_request_id) {
        throw new Error('leave_request_id is required');
    }

    const leaveRequest = await LeaveRequest.findById(leave_request_id);
    if (!leaveRequest) {
        throw new Error('Leave request not found');
    }

    let nextStatus = leaveRequest.status;
    if (status !== undefined) {
        nextStatus = normalizeEnum(status, 'status', ['PENDING', 'APPROVED', 'REJECTED']);
        leaveRequest.status = nextStatus;
        leaveRequest.approval_date = nextStatus === 'PENDING' ? null : new Date();
    }

    if (remarks !== undefined) {
        leaveRequest.remarks = remarks;
    }

    await leaveRequest.save();

    if (status !== undefined) {
        await notifyStudentAndParents({
            student_id: leaveRequest.student_id,
            title: 'Leave request updated',
            message: `Your leave request has been ${nextStatus.toLowerCase()}.`,
            type: 'LEAVE_REQUEST',
            created_by: adminId,
            delivery_channels,
        });
    }

    return populateLeaveRequestQuery(
        LeaveRequest.findById(leaveRequest._id)
    );
};

const buildComplaintQuery = (filters = {}) => {
    const query = {};

    if (filters.complaint_id) {
        query._id = filters.complaint_id;
    }

    if (filters.student_id) {
        query.student_id = filters.student_id;
    }

    if (filters.manager_id) {
        query.manager_id = filters.manager_id;
    }

    if (filters.status) {
        query.status = normalizeEnum(filters.status, 'status', ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']);
    }

    if (filters.category) {
        query.category = normalizeEnum(filters.category, 'category', ['MAINTENANCE', 'CLEANLINESS', 'NOISE', 'OTHER']);
    }

    return query;
};

const getComplaints = async (filters = {}) => {
    const complaints = await populateComplaintQuery(
        Complaint.find(buildComplaintQuery(filters)).sort({ createdAt: -1 })
    );

    return {
        filters: {
            complaint_id: filters.complaint_id || null,
            student_id: filters.student_id || null,
            manager_id: filters.manager_id || null,
            status: filters.status ? String(filters.status).trim().toUpperCase() : null,
            category: filters.category ? String(filters.category).trim().toUpperCase() : null,
        },
        summary: buildSummary(
            complaints,
            { total: 0, open: 0, in_progress: 0, resolved: 0, closed: 0 },
            (record) => record.status.toLowerCase()
        ),
        complaints,
    };
};

const updateComplaint = async ({
    complaint_id,
    status,
    comments,
    delivery_channels = ['IN_APP'],
}, adminId) => {
    if (!complaint_id) {
        throw new Error('complaint_id is required');
    }

    const complaint = await Complaint.findById(complaint_id);
    if (!complaint) {
        throw new Error('Complaint not found');
    }

    let nextStatus = complaint.status;
    if (status !== undefined) {
        nextStatus = normalizeEnum(status, 'status', ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']);
        complaint.status = nextStatus;
        complaint.resolution_date = ['RESOLVED', 'CLOSED'].includes(nextStatus) ? new Date() : null;
    }

    if (comments !== undefined) {
        complaint.comments = comments;
    }

    await complaint.save();

    if (status !== undefined || comments !== undefined) {
        const commentSuffix = comments ? ` ${comments}` : '';
        await notifyStudentAndParents({
            student_id: complaint.student_id,
            title: 'Complaint status updated',
            message: `Your complaint has been marked ${nextStatus.toLowerCase()}.${commentSuffix}`,
            type: 'COMPLAINT',
            created_by: adminId,
            delivery_channels,
        });
    }

    return populateComplaintQuery(
        Complaint.findById(complaint._id)
    );
};

const getNotifications = async (filters = {}, adminId = null) => notificationService.getNotificationsForRole(
    'ADMIN',
    {
        ...filters,
        user_id: adminId,
    }
);

const markNotificationsRead = async (payload, adminId) => notificationService.markNotificationsRead({
    ...payload,
    recipient_role: 'ADMIN',
    user_id: adminId,
});

const createNotification = async ({
    title,
    message,
    type = 'ANNOUNCEMENT',
    recipient_role = 'ALL',
    student_id = null,
    room_number = null,
    floor_number = null,
    delivery_channels = ['IN_APP'],
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
        delivery_channels,
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

const getOccupancyReport = async (filters = {}) => {
    const floorQuery = {};
    if (filters.floor_id) {
        floorQuery._id = filters.floor_id;
    }

    const floors = await Floor.find(floorQuery).sort({ floor_number: 1 }).lean();
    const floorIds = floors.map((floor) => floor._id);
    const roomQuery = floorIds.length ? { floor_id: { $in: floorIds } } : { _id: { $in: [] } };
    const rooms = await Room.find(roomQuery).sort({ room_number: 1 }).lean();
    const roomIds = rooms.map((room) => room._id);
    const beds = roomIds.length ? await Bed.find({ room_id: { $in: roomIds } }).lean() : [];
    const students = roomIds.length
        ? await Student.find({ room_id: { $in: roomIds } })
            .select('room_id status hostel_status')
            .lean()
        : [];

    const roomsByFloorId = rooms.reduce((accumulator, room) => {
        const key = String(room.floor_id);
        if (!accumulator[key]) {
            accumulator[key] = [];
        }

        accumulator[key].push(room);
        return accumulator;
    }, {});

    const bedsByRoomId = beds.reduce((accumulator, bed) => {
        const key = String(bed.room_id);
        if (!accumulator[key]) {
            accumulator[key] = [];
        }

        accumulator[key].push(bed);
        return accumulator;
    }, {});

    const studentsByRoomId = students.reduce((accumulator, student) => {
        const key = String(student.room_id);
        if (!accumulator[key]) {
            accumulator[key] = [];
        }

        accumulator[key].push(student);
        return accumulator;
    }, {});

    const floorReports = floors.map((floor) => {
        const floorRooms = roomsByFloorId[String(floor._id)] || [];
        const roomReports = floorRooms.map((room) => {
            const roomBeds = bedsByRoomId[String(room._id)] || [];
            const roomStudents = studentsByRoomId[String(room._id)] || [];
            return {
                _id: room._id,
                room_number: room.room_number,
                status: room.status,
                total_beds: room.total_beds,
                occupied_beds: room.occupied_beds,
                available_beds: Math.max(room.total_beds - room.occupied_beds, 0),
                occupancy_rate: room.total_beds ? Number(((room.occupied_beds / room.total_beds) * 100).toFixed(2)) : 0,
                beds: roomBeds.length,
                students: {
                    allotted: roomStudents.filter((student) => student.status === 'ALLOTTED').length,
                    checked_in: roomStudents.filter((student) => student.hostel_status === 'CHECKED_IN').length,
                    checked_out: roomStudents.filter((student) => student.hostel_status === 'CHECKED_OUT').length,
                },
            };
        });

        const totalBeds = roomReports.reduce((sum, room) => sum + room.total_beds, 0);
        const occupiedBeds = roomReports.reduce((sum, room) => sum + room.occupied_beds, 0);

        return {
            _id: floor._id,
            floor_number: floor.floor_number,
            status: floor.status,
            total_capacity: floor.total_capacity,
            rooms: roomReports,
            summary: {
                total_rooms: roomReports.length,
                total_beds: totalBeds,
                occupied_beds: occupiedBeds,
                available_beds: totalBeds - occupiedBeds,
                occupancy_rate: totalBeds ? Number(((occupiedBeds / totalBeds) * 100).toFixed(2)) : 0,
            },
        };
    });

    const totalBeds = floorReports.reduce((sum, floor) => sum + floor.summary.total_beds, 0);
    const occupiedBeds = floorReports.reduce((sum, floor) => sum + floor.summary.occupied_beds, 0);

    return {
        generated_at: new Date(),
        filters: {
            floor_id: filters.floor_id || null,
        },
        summary: {
            total_floors: floorReports.length,
            total_rooms: floorReports.reduce((sum, floor) => sum + floor.summary.total_rooms, 0),
            total_beds: totalBeds,
            occupied_beds: occupiedBeds,
            available_beds: totalBeds - occupiedBeds,
            occupancy_rate: totalBeds ? Number(((occupiedBeds / totalBeds) * 100).toFixed(2)) : 0,
        },
        floors: floorReports,
    };
};

const getFinancialReport = async (filters = {}) => {
    const query = buildFeeQuery(filters);
    const records = await FeePayment.find(query)
        .populate('student_id', 'name email status hostel_status')
        .sort({ year: -1, createdAt: -1 });

    const monthlyBreakdownMap = records.reduce((accumulator, record) => {
        const key = `${record.year}-${record.month}`;
        if (!accumulator[key]) {
            accumulator[key] = {
                year: record.year,
                month: record.month,
                total_records: 0,
                total_amount: 0,
                paid_amount: 0,
                pending_amount: 0,
                overdue_amount: 0,
            };
        }

        accumulator[key].total_records += 1;
        accumulator[key].total_amount += record.amount;
        accumulator[key][`${record.status.toLowerCase()}_amount`] += record.amount;
        return accumulator;
    }, {});

    return {
        generated_at: new Date(),
        filters: {
            student_id: filters.student_id || null,
            status: filters.status ? String(filters.status).trim().toUpperCase() : null,
            year: filters.year !== undefined ? parseYear(filters.year) : null,
            month: filters.month ? String(filters.month).trim() : null,
        },
        summary: finalizeFeeSummary(buildFeeSummaryFromRecords(records)),
        monthly_breakdown: Object.values(monthlyBreakdownMap).sort((left, right) => {
            if (left.year !== right.year) {
                return right.year - left.year;
            }

            const leftMonthOrder = MONTH_ORDER[String(left.month).trim().toUpperCase()] || 99;
            const rightMonthOrder = MONTH_ORDER[String(right.month).trim().toUpperCase()] || 99;
            return rightMonthOrder - leftMonthOrder;
        }),
        records,
    };
};

const getAttendanceReport = async (filters = {}) => {
    const query = {};

    if (filters.student_id) {
        query.student_id = filters.student_id;
    }

    if (filters.manager_id) {
        query.manager_id = filters.manager_id;
    }

    if (filters.floor_id) {
        query.floor_id = filters.floor_id;
    }

    if (filters.room_id) {
        query.room_id = filters.room_id;
    }

    if (filters.status) {
        query.status = normalizeEnum(filters.status, 'status', ['PRESENT', 'ABSENT', 'ON_LEAVE']);
    }

    const fromDate = parseDate(filters.from_date || filters.date, 'from_date');
    const toDate = parseDate(filters.to_date || filters.date, 'to_date');
    if (fromDate || toDate) {
        query.date = {};
        if (fromDate) {
            query.date.$gte = startOfDay(fromDate);
        }
        if (toDate) {
            query.date.$lte = endOfDay(toDate);
        }
    }

    const records = await Attendance.find(query)
        .populate('student_id', 'name email status hostel_status')
        .populate('manager_id', 'name email building_name')
        .populate('room_id', 'room_number status')
        .populate('floor_id', 'floor_number status')
        .sort({ date: -1, createdAt: -1 });

    const byFloor = records.reduce((accumulator, record) => {
        const floorKey = String(record.floor_id?._id || 'unassigned');
        if (!accumulator[floorKey]) {
            accumulator[floorKey] = {
                floor_id: record.floor_id?._id || null,
                floor_number: record.floor_id?.floor_number || null,
                total: 0,
                present: 0,
                absent: 0,
                on_leave: 0,
            };
        }

        accumulator[floorKey].total += 1;
        accumulator[floorKey][record.status.toLowerCase()] += 1;
        return accumulator;
    }, {});

    const byRoom = records.reduce((accumulator, record) => {
        const roomKey = String(record.room_id?._id || 'unassigned');
        if (!accumulator[roomKey]) {
            accumulator[roomKey] = {
                room_id: record.room_id?._id || null,
                room_number: record.room_id?.room_number || null,
                total: 0,
                present: 0,
                absent: 0,
                on_leave: 0,
            };
        }

        accumulator[roomKey].total += 1;
        accumulator[roomKey][record.status.toLowerCase()] += 1;
        return accumulator;
    }, {});

    return {
        generated_at: new Date(),
        filters: {
            student_id: filters.student_id || null,
            manager_id: filters.manager_id || null,
            floor_id: filters.floor_id || null,
            room_id: filters.room_id || null,
            status: filters.status ? String(filters.status).trim().toUpperCase() : null,
            from_date: filters.from_date || filters.date || null,
            to_date: filters.to_date || filters.date || null,
        },
        summary: buildSummary(
            records,
            { total: 0, present: 0, absent: 0, on_leave: 0 },
            (record) => record.status.toLowerCase()
        ),
        by_floor: Object.values(byFloor),
        by_room: Object.values(byRoom),
        records,
    };
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
        notificationService.getNotificationsForRole('ADMIN', { limit: 5 }),
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
    getLeaveRequests,
    updateLeaveRequest,
    getComplaints,
    updateComplaint,
    getFeePayments,
    recordFeePayment,
    sendFeeReminder,
    getNotifications,
    markNotificationsRead,
    createNotification,
    deleteNotification,
    getOccupancyReport,
    getFinancialReport,
    getAttendanceReport,
};
