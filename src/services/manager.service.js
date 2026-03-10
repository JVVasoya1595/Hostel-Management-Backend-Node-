const Manager = require('../models/manager.model');
const Student = require('../models/student.model');
const Room = require('../models/room.model');
const Floor = require('../models/floor.model');
const Bed = require('../models/bed.model');
const Complaint = require('../models/complaint.model');
const LeaveRequest = require('../models/leaveRequest.model');
const Attendance = require('../models/attendance.model');
const roomService = require('./room.service');

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

const startOfDay = (value = new Date()) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        throw new Error('Invalid date');
    }

    date.setHours(0, 0, 0, 0);
    return date;
};

const endOfDay = (value = new Date()) => {
    const date = startOfDay(value);
    date.setDate(date.getDate() + 1);
    return date;
};

const parseOptionalDate = (value, fieldName) => {
    if (!value) {
        return null;
    }

    const parsedDate = new Date(value);
    if (Number.isNaN(parsedDate.getTime())) {
        throw new Error(`${fieldName} must be a valid date`);
    }

    return parsedDate;
};

const toIdString = (value) => String(value);

const buildStudentQuery = (roomIds) => {
    if (!roomIds.length) {
        return { _id: { $in: [] } };
    }

    return { room_id: { $in: roomIds } };
};

const getManagerScope = async (managerId) => {
    const manager = await Manager.findById(managerId)
        .select('-encryptedPassword')
        .populate('assigned_floor_ids', 'floor_number status total_capacity');

    if (!manager) {
        throw new Error('Manager not found');
    }

    let floors = manager.assigned_floor_ids || [];
    let scopeMode = 'ASSIGNED_FLOORS';

    if (!floors.length) {
        floors = await Floor.find().sort({ floor_number: 1 }).lean();
        scopeMode = 'ALL_FLOORS';
    }

    const floorIds = floors.map((floor) => floor._id);
    const rooms = floorIds.length
        ? await Room.find({ floor_id: { $in: floorIds } })
            .populate('floor_id', 'floor_number status')
            .sort({ room_number: 1 })
            .lean()
        : [];
    const roomIds = rooms.map((room) => room._id);

    return {
        manager: sanitizeDocument(manager),
        building_name: manager.building_name || 'Main Hostel',
        scope_mode: scopeMode,
        floors,
        floorIds,
        rooms,
        roomIds,
    };
};

const ensureManagedRoom = async (scope, roomId) => {
    const room = await Room.findById(roomId).populate('floor_id', 'floor_number status');
    if (!room) {
        throw new Error('Room not found');
    }

    const isManaged = scope.floorIds.some((floorId) => toIdString(floorId) === toIdString(room.floor_id?._id || room.floor_id));
    if (!isManaged) {
        throw new Error('Room is outside the manager scope');
    }

    return room;
};

const ensureManagedStudent = async (scope, studentId, { requireRoom = true } = {}) => {
    const student = await Student.findById(studentId)
        .select('-encryptedPassword')
        .populate({ path: 'room_id', select: 'room_number status floor_id total_beds occupied_beds', populate: { path: 'floor_id', select: 'floor_number status' } })
        .populate('bed_id', 'bed_number is_occupied')
        .populate('checked_in_by', 'name email')
        .populate('checked_out_by', 'name email');

    if (!student) {
        throw new Error('Student not found');
    }

    if (!student.room_id) {
        if (requireRoom) {
            throw new Error('Student is not currently assigned to any room');
        }

        return student;
    }

    const floorId = student.room_id.floor_id?._id || student.room_id.floor_id;
    const isManaged = scope.floorIds.some((managedFloorId) => toIdString(managedFloorId) === toIdString(floorId));
    if (!isManaged) {
        throw new Error('Student is outside the manager scope');
    }

    return student;
};

const buildScopeSummary = async (scope) => {
    const managedRoomFilter = { room_id: { $in: scope.roomIds } };
    const [totalBeds, occupiedBeds, totalStudents, checkedInStudents, checkedOutStudents, pendingCheckInStudents] = await Promise.all([
        Bed.countDocuments(managedRoomFilter),
        Bed.countDocuments({ ...managedRoomFilter, is_occupied: true }),
        Student.countDocuments(buildStudentQuery(scope.roomIds)),
        Student.countDocuments({ ...managedRoomFilter, hostel_status: 'CHECKED_IN' }),
        Student.countDocuments({ ...managedRoomFilter, hostel_status: 'CHECKED_OUT' }),
        Student.countDocuments({ ...managedRoomFilter, hostel_status: 'NOT_CHECKED_IN' }),
    ]);

    const fullRooms = scope.rooms.filter((room) => room.status === 'FULL').length;
    const availableRooms = scope.rooms.length - fullRooms;

    return {
        building_name: scope.building_name,
        scope_mode: scope.scope_mode,
        floors: {
            total: scope.floors.length,
            assigned: scope.scope_mode === 'ASSIGNED_FLOORS' ? scope.floors.length : 0,
        },
        rooms: {
            total: scope.rooms.length,
            full: fullRooms,
            available: availableRooms,
        },
        beds: {
            total: totalBeds,
            occupied: occupiedBeds,
            free: totalBeds - occupiedBeds,
        },
        students: {
            total: totalStudents,
            checked_in: checkedInStudents,
            checked_out: checkedOutStudents,
            pending_check_in: pendingCheckInStudents,
        },
    };
};

const getProfile = async (managerId) => {
    const scope = await getManagerScope(managerId);
    return {
        ...scope.manager,
        building_name: scope.building_name,
        scope_mode: scope.scope_mode,
        assigned_floors: scope.floors,
    };
};

const getDashboard = async (managerId) => {
    const scope = await getManagerScope(managerId);
    const todayStart = startOfDay();
    const todayEnd = endOfDay();

    const [
        scopeSummary,
        totalComplaints,
        openComplaints,
        inProgressComplaints,
        resolvedComplaints,
        totalLeaveRequests,
        pendingLeaveRequests,
        approvedLeaveRequests,
        rejectedLeaveRequests,
        presentToday,
        absentToday,
        onLeaveToday,
        markedToday,
    ] = await Promise.all([
        buildScopeSummary(scope),
        Complaint.countDocuments({ manager_id: managerId }),
        Complaint.countDocuments({ manager_id: managerId, status: 'OPEN' }),
        Complaint.countDocuments({ manager_id: managerId, status: 'IN_PROGRESS' }),
        Complaint.countDocuments({ manager_id: managerId, status: 'RESOLVED' }),
        LeaveRequest.countDocuments({ manager_id: managerId }),
        LeaveRequest.countDocuments({ manager_id: managerId, status: 'PENDING' }),
        LeaveRequest.countDocuments({ manager_id: managerId, status: 'APPROVED' }),
        LeaveRequest.countDocuments({ manager_id: managerId, status: 'REJECTED' }),
        Attendance.countDocuments({ manager_id: managerId, date: { $gte: todayStart, $lt: todayEnd }, status: 'PRESENT' }),
        Attendance.countDocuments({ manager_id: managerId, date: { $gte: todayStart, $lt: todayEnd }, status: 'ABSENT' }),
        Attendance.countDocuments({ manager_id: managerId, date: { $gte: todayStart, $lt: todayEnd }, status: 'ON_LEAVE' }),
        Attendance.countDocuments({ manager_id: managerId, date: { $gte: todayStart, $lt: todayEnd } }),
    ]);

    return {
        ...scopeSummary,
        operations: {
            complaints: {
                total: totalComplaints,
                open: openComplaints,
                in_progress: inProgressComplaints,
                resolved: resolvedComplaints,
            },
            leave_requests: {
                total: totalLeaveRequests,
                pending: pendingLeaveRequests,
                approved: approvedLeaveRequests,
                rejected: rejectedLeaveRequests,
            },
        },
        attendance_today: {
            marked: markedToday,
            present: presentToday,
            absent: absentToday,
            on_leave: onLeaveToday,
            unmarked: Math.max(scopeSummary.students.checked_in - markedToday, 0),
        },
    };
};

const getAssignmentOverview = async (managerId) => {
    const scope = await getManagerScope(managerId);
    const roomsByFloorId = scope.rooms.reduce((accumulator, room) => {
        const floorId = toIdString(room.floor_id?._id || room.floor_id);
        if (!accumulator[floorId]) {
            accumulator[floorId] = [];
        }

        accumulator[floorId].push({
            ...room,
            available_beds: room.total_beds - room.occupied_beds,
        });
        return accumulator;
    }, {});

    const floors = scope.floors.map((floor) => {
        const floorId = toIdString(floor._id);
        const rooms = roomsByFloorId[floorId] || [];
        const totalBeds = rooms.reduce((sum, room) => sum + room.total_beds, 0);
        const occupiedBeds = rooms.reduce((sum, room) => sum + room.occupied_beds, 0);

        return {
            ...sanitizeDocument(floor),
            rooms,
            summary: {
                total_rooms: rooms.length,
                total_beds: totalBeds,
                occupied_beds: occupiedBeds,
                free_beds: totalBeds - occupiedBeds,
            },
        };
    });

    return {
        building_name: scope.building_name,
        scope_mode: scope.scope_mode,
        floors,
    };
};

const getManagedStudents = async (managerId, filters = {}) => {
    const scope = await getManagerScope(managerId);
    const query = buildStudentQuery(scope.roomIds);

    if (filters.student_id) {
        query._id = filters.student_id;
    }

    if (filters.hostel_status) {
        query.hostel_status = String(filters.hostel_status).trim().toUpperCase();
    }

    if (filters.status) {
        query.status = String(filters.status).trim().toUpperCase();
    }

    const students = await Student.find(query)
        .select('-encryptedPassword')
        .populate({ path: 'room_id', select: 'room_number status floor_id total_beds occupied_beds', populate: { path: 'floor_id', select: 'floor_number status' } })
        .populate('bed_id', 'bed_number is_occupied')
        .populate('checked_in_by', 'name email')
        .populate('checked_out_by', 'name email')
        .sort({ createdAt: -1 });

    return {
        building_name: scope.building_name,
        scope_mode: scope.scope_mode,
        students: students.map(sanitizeDocument),
    };
};

const updateStudentInfo = async (managerId, payload) => {
    const { student_id, name, phone } = payload;
    if (!student_id) {
        throw new Error('student_id is required');
    }

    if (name === undefined && phone === undefined) {
        throw new Error('At least one updatable field is required');
    }

    const scope = await getManagerScope(managerId);
    const student = await ensureManagedStudent(scope, student_id);

    if (name !== undefined) {
        student.name = name;
    }

    if (phone !== undefined) {
        student.phone = phone;
    }

    await student.save();
    return sanitizeDocument(student);
};

const checkInStudent = async (managerId, payload) => {
    const { student_id, room_id } = payload;
    if (!student_id) {
        throw new Error('student_id is required');
    }

    const scope = await getManagerScope(managerId);
    const student = await Student.findById(student_id);
    if (!student) {
        throw new Error('Student not found');
    }

    if (student.hostel_status === 'CHECKED_IN') {
        throw new Error('Student is already checked in');
    }

    let assignmentResult;
    if (student.status === 'ALLOTTED' && student.room_id && student.bed_id) {
        const assignedRoom = await ensureManagedRoom(scope, student.room_id);
        if (room_id && toIdString(room_id) !== toIdString(assignedRoom._id)) {
            throw new Error('Student is already allotted a different room');
        }

        assignmentResult = await roomService.getStudentRoom(student_id);
    } else {
        if (!room_id) {
            throw new Error('room_id is required for check-in when the student has no room allocation');
        }

        await ensureManagedRoom(scope, room_id);
        assignmentResult = await roomService.assignRoom(student_id, room_id);
    }

    const updatedStudent = await Student.findByIdAndUpdate(
        student_id,
        {
            hostel_status: 'CHECKED_IN',
            check_in_date: new Date(),
            check_out_date: null,
            checked_in_by: managerId,
        },
        { new: true }
    )
        .select('-encryptedPassword')
        .populate({ path: 'room_id', select: 'room_number status floor_id total_beds occupied_beds', populate: { path: 'floor_id', select: 'floor_number status' } })
        .populate('bed_id', 'bed_number is_occupied')
        .populate('checked_in_by', 'name email');

    return {
        message: 'Student checked in successfully',
        assignment: assignmentResult,
        student: sanitizeDocument(updatedStudent),
    };
};

const checkOutStudent = async (managerId, payload) => {
    const { student_id, remarks = null } = payload;
    if (!student_id) {
        throw new Error('student_id is required');
    }

    const scope = await getManagerScope(managerId);
    await ensureManagedStudent(scope, student_id);

    const checkoutResult = await roomService.unassignRoom(student_id);
    const updatedStudent = await Student.findByIdAndUpdate(
        student_id,
        {
            hostel_status: 'CHECKED_OUT',
            check_out_date: new Date(),
            checked_out_by: managerId,
        },
        { new: true }
    )
        .select('-encryptedPassword')
        .populate('checked_out_by', 'name email');

    return {
        ...checkoutResult,
        remarks,
        student: sanitizeDocument(updatedStudent),
    };
};

const getRoomVacancy = async (managerId) => {
    const scope = await getManagerScope(managerId);
    const floors = scope.floors.map((floor) => {
        const floorId = toIdString(floor._id);
        const rooms = scope.rooms
            .filter((room) => toIdString(room.floor_id?._id || room.floor_id) === floorId)
            .map((room) => ({
                ...room,
                available_beds: room.total_beds - room.occupied_beds,
            }));

        const totalBeds = rooms.reduce((sum, room) => sum + room.total_beds, 0);
        const occupiedBeds = rooms.reduce((sum, room) => sum + room.occupied_beds, 0);

        return {
            ...sanitizeDocument(floor),
            rooms,
            summary: {
                total_rooms: rooms.length,
                total_beds: totalBeds,
                occupied_beds: occupiedBeds,
                free_beds: totalBeds - occupiedBeds,
            },
        };
    });

    const totalBeds = floors.reduce((sum, floor) => sum + floor.summary.total_beds, 0);
    const occupiedBeds = floors.reduce((sum, floor) => sum + floor.summary.occupied_beds, 0);

    return {
        building_name: scope.building_name,
        scope_mode: scope.scope_mode,
        summary: {
            total_rooms: scope.rooms.length,
            available_rooms: scope.rooms.filter((room) => room.status === 'AVAILABLE').length,
            total_beds: totalBeds,
            occupied_beds: occupiedBeds,
            free_beds: totalBeds - occupiedBeds,
        },
        floors,
    };
};

const getComplaints = async (managerId, filters = {}) => {
    const query = { manager_id: managerId };

    if (filters.status) {
        query.status = String(filters.status).trim().toUpperCase();
    }

    if (filters.complaint_id) {
        query._id = filters.complaint_id;
    }

    const complaints = await Complaint.find(query)
        .populate('student_id', 'name email phone hostel_status status')
        .sort({ createdAt: -1 });

    return complaints;
};

const updateComplaint = async (managerId, payload) => {
    const { complaint_id, status, comments } = payload;
    if (!complaint_id) {
        throw new Error('complaint_id is required');
    }

    const complaint = await Complaint.findOne({ _id: complaint_id, manager_id: managerId });
    if (!complaint) {
        throw new Error('Complaint not found');
    }

    if (status !== undefined) {
        const normalizedStatus = String(status).trim().toUpperCase();
        if (!['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].includes(normalizedStatus)) {
            throw new Error('Invalid complaint status');
        }

        complaint.status = normalizedStatus;
        complaint.resolution_date = ['RESOLVED', 'CLOSED'].includes(normalizedStatus) ? new Date() : null;
    }

    if (comments !== undefined) {
        complaint.comments = comments;
    }

    await complaint.save();
    return Complaint.findById(complaint._id).populate('student_id', 'name email phone hostel_status status');
};

const getLeaveRequests = async (managerId, filters = {}) => {
    const query = { manager_id: managerId };

    if (filters.status) {
        query.status = String(filters.status).trim().toUpperCase();
    }

    const leaveRequests = await LeaveRequest.find(query)
        .populate('student_id', 'name email phone hostel_status status')
        .sort({ createdAt: -1 });

    return leaveRequests;
};

const normalizeAttendancePayload = (payload) => {
    if (Array.isArray(payload.records) && payload.records.length > 0) {
        return payload.records;
    }

    if (payload.student_id && payload.status) {
        return [{
            student_id: payload.student_id,
            status: payload.status,
            remarks: payload.remarks,
        }];
    }

    throw new Error('Attendance payload must include records or student_id and status');
};

const recordAttendance = async (managerId, payload) => {
    const scope = await getManagerScope(managerId);
    const records = normalizeAttendancePayload(payload);
    const attendanceDate = startOfDay(parseOptionalDate(payload.date, 'date') || new Date());

    const savedRecords = [];
    for (const record of records) {
        const normalizedStatus = String(record.status || '').trim().toUpperCase();
        if (!['PRESENT', 'ABSENT', 'ON_LEAVE'].includes(normalizedStatus)) {
            throw new Error('Attendance status must be PRESENT, ABSENT or ON_LEAVE');
        }

        const student = await ensureManagedStudent(scope, record.student_id);
        const attendance = await Attendance.findOneAndUpdate(
            { student_id: student._id, date: attendanceDate },
            {
                student_id: student._id,
                manager_id: managerId,
                room_id: student.room_id?._id || student.room_id || null,
                floor_id: student.room_id?.floor_id?._id || student.room_id?.floor_id || null,
                date: attendanceDate,
                status: normalizedStatus,
                remarks: record.remarks || null,
            },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        )
            .populate('student_id', 'name email hostel_status status')
            .populate('room_id', 'room_number status')
            .populate('floor_id', 'floor_number status');

        savedRecords.push(attendance);
    }

    const summary = savedRecords.reduce((accumulator, record) => {
        accumulator.total += 1;
        accumulator[record.status.toLowerCase()] += 1;
        return accumulator;
    }, { total: 0, present: 0, absent: 0, on_leave: 0 });

    return {
        date: attendanceDate,
        summary,
        records: savedRecords,
    };
};

const getAttendanceReport = async (managerId, filters = {}) => {
    const scope = await getManagerScope(managerId);
    const query = { manager_id: managerId };

    if (scope.floorIds.length) {
        query.floor_id = { $in: scope.floorIds };
    }

    if (filters.student_id) {
        query.student_id = filters.student_id;
    }

    if (filters.status) {
        query.status = String(filters.status).trim().toUpperCase();
    }

    const fromDate = parseOptionalDate(filters.from_date || filters.date, 'from_date');
    const toDate = parseOptionalDate(filters.to_date || filters.date, 'to_date');
    if (fromDate || toDate) {
        query.date = {};
        if (fromDate) {
            query.date.$gte = startOfDay(fromDate);
        }
        if (toDate) {
            query.date.$lt = endOfDay(toDate);
        }
    }

    const records = await Attendance.find(query)
        .populate('student_id', 'name email hostel_status status')
        .populate('room_id', 'room_number status')
        .populate('floor_id', 'floor_number status')
        .sort({ date: -1, createdAt: -1 });

    const summary = records.reduce((accumulator, record) => {
        accumulator.total += 1;
        accumulator[record.status.toLowerCase()] += 1;
        return accumulator;
    }, { total: 0, present: 0, absent: 0, on_leave: 0 });

    return {
        building_name: scope.building_name,
        scope_mode: scope.scope_mode,
        filters: {
            student_id: filters.student_id || null,
            status: filters.status ? String(filters.status).trim().toUpperCase() : null,
            from_date: query.date?.$gte || null,
            to_date: query.date?.$lt || null,
        },
        summary,
        records,
    };
};

module.exports = {
    getProfile,
    getDashboard,
    getAssignmentOverview,
    getManagedStudents,
    updateStudentInfo,
    checkInStudent,
    checkOutStudent,
    getRoomVacancy,
    getComplaints,
    updateComplaint,
    getLeaveRequests,
    recordAttendance,
    getAttendanceReport,
};
