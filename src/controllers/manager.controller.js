const logger = require('../utils/logger');
const { encryptData } = require('../utils/encryption');
const { validateManagerRequest, validateManagerRequestBody } = require('../utils/validators/manager.validator');
const managerService = require('../services/manager.service');

const sendEncryptedResponse = (res, status, message, payload) => {
    return res.status(status).json({
        message,
        data: encryptData(payload),
    });
};

const resolveErrorStatus = (error) => {
    const message = String(error.message || '').toLowerCase();
    if (message.includes('not found')) {
        return 404;
    }

    return 400;
};

const handleActionError = (res, action, error) => {
    logger.error(`${action} failed:`, error);
    return res.status(resolveErrorStatus(error)).json({ message: error.message || 'SERVER ERROR' });
};

const runParamRequest = async (req, res, action, successMessage, handler) => {
    try {
        logger.info(`${action} request received`);
        const validation = await validateManagerRequest(req);
        if (validation.error) {
            return res.status(validation.status).json({ message: validation.message });
        }

        const payload = await handler(validation);
        return sendEncryptedResponse(res, 200, successMessage, payload);
    } catch (error) {
        return handleActionError(res, action, error);
    }
};

const runBodyRequest = async (req, res, action, successMessage, handler, successStatus = 200) => {
    try {
        logger.info(`${action} request received`);
        const validation = await validateManagerRequestBody(req);
        if (validation.error) {
            return res.status(validation.status).json({ message: validation.message });
        }

        const payload = await handler(validation);
        return sendEncryptedResponse(res, successStatus, successMessage, payload);
    } catch (error) {
        return handleActionError(res, action, error);
    }
};

const getProfile = async (req, res) => runParamRequest(
    req,
    res,
    'Get manager profile',
    'Profile retrieved successfully',
    ({ user }) => managerService.getProfile(user._id)
);

const getDashboard = async (req, res) => runParamRequest(
    req,
    res,
    'Get manager dashboard',
    'Dashboard retrieved successfully',
    ({ user }) => managerService.getDashboard(user._id)
);

const getAssignmentOverview = async (req, res) => runParamRequest(
    req,
    res,
    'Get manager assignment overview',
    'Assignment overview retrieved successfully',
    ({ user }) => managerService.getAssignmentOverview(user._id)
);

const getAllStudents = async (req, res) => runParamRequest(
    req,
    res,
    'Get managed students',
    'Students retrieved successfully',
    ({ user, data }) => managerService.getManagedStudents(user._id, data)
);

const updateStudentInfo = async (req, res) => runBodyRequest(
    req,
    res,
    'Update student information',
    'Student updated successfully',
    ({ user, data }) => managerService.updateStudentInfo(user._id, data)
);

const checkInStudent = async (req, res) => runBodyRequest(
    req,
    res,
    'Check in student',
    'Student checked in successfully',
    ({ user, data }) => managerService.checkInStudent(user._id, data)
);

const checkOutStudent = async (req, res) => runBodyRequest(
    req,
    res,
    'Check out student',
    'Student checked out successfully',
    ({ user, data }) => managerService.checkOutStudent(user._id, data)
);

const getRoomVacancy = async (req, res) => runParamRequest(
    req,
    res,
    'Get room vacancy',
    'Room vacancy retrieved successfully',
    ({ user }) => managerService.getRoomVacancy(user._id)
);

const getLeaveRequests = async (req, res) => runParamRequest(
    req,
    res,
    'Get leave requests',
    'Leave requests retrieved successfully',
    ({ user, data }) => managerService.getLeaveRequests(user._id, data)
);

const updateLeaveRequest = async (req, res) => runBodyRequest(
    req,
    res,
    'Update leave request',
    'Leave request updated successfully',
    ({ user, data }) => managerService.updateLeaveRequest(user._id, data)
);

const getComplaints = async (req, res) => runParamRequest(
    req,
    res,
    'Get complaints',
    'Complaints retrieved successfully',
    ({ user, data }) => managerService.getComplaints(user._id, data)
);

const updateComplaint = async (req, res) => runBodyRequest(
    req,
    res,
    'Update complaint',
    'Complaint updated successfully',
    ({ user, data }) => managerService.updateComplaint(user._id, data)
);

const getNotifications = async (req, res) => runParamRequest(
    req,
    res,
    'Get manager notifications',
    'Notifications retrieved successfully',
    ({ user, data }) => managerService.getNotifications(user._id, data)
);

const markNotificationsRead = async (req, res) => runBodyRequest(
    req,
    res,
    'Mark manager notifications read',
    'Notifications marked as read successfully',
    ({ user, data }) => managerService.markNotificationsRead(user._id, data)
);

const recordAttendance = async (req, res) => runBodyRequest(
    req,
    res,
    'Record attendance',
    'Attendance recorded successfully',
    ({ user, data }) => managerService.recordAttendance(user._id, data)
);

const getAttendanceReport = async (req, res) => runParamRequest(
    req,
    res,
    'Get attendance report',
    'Attendance report retrieved successfully',
    ({ user, data }) => managerService.getAttendanceReport(user._id, data)
);

module.exports = {
    getProfile,
    getDashboard,
    getAssignmentOverview,
    getAllStudents,
    updateStudentInfo,
    checkInStudent,
    checkOutStudent,
    getRoomVacancy,
    getLeaveRequests,
    updateLeaveRequest,
    getComplaints,
    updateComplaint,
    recordAttendance,
    getAttendanceReport,
    getNotifications,
    markNotificationsRead,
};
