const logger = require('../utils/logger');
const { encryptData } = require('../utils/encryption');
const { validateStudentRequest, validateStudentRequestBody } = require('../utils/validators/student.validator');
const studentService = require('../services/student.service');

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
        const validation = await validateStudentRequest(req);
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
        const validation = await validateStudentRequestBody(req);
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
    'Get student profile',
    'Profile retrieved successfully',
    ({ user }) => studentService.getProfile(user._id)
);

const updateProfile = async (req, res) => runBodyRequest(
    req,
    res,
    'Update student profile',
    'Profile updated successfully',
    ({ user, data }) => studentService.updateProfile(user._id, data)
);

const getDashboard = async (req, res) => runParamRequest(
    req,
    res,
    'Get student dashboard',
    'Dashboard retrieved successfully',
    ({ user }) => studentService.getDashboard(user._id)
);

const getRoomAssignment = async (req, res) => runParamRequest(
    req,
    res,
    'Get student room assignment',
    'Room assignment retrieved successfully',
    ({ user }) => studentService.buildRoomAssignment(user._id)
);

const getLeaveRequests = async (req, res) => runParamRequest(
    req,
    res,
    'Get student leave requests',
    'Leave requests retrieved successfully',
    ({ user, data }) => studentService.getLeaveRequests(user._id, data)
);

const submitLeaveRequest = async (req, res) => runBodyRequest(
    req,
    res,
    'Submit leave request',
    'Leave request submitted successfully',
    ({ user, data }) => studentService.submitLeaveRequest(user._id, data),
    201
);

const getComplaints = async (req, res) => runParamRequest(
    req,
    res,
    'Get student complaints',
    'Complaints retrieved successfully',
    ({ user, data }) => studentService.getComplaints(user._id, data)
);

const submitComplaint = async (req, res) => runBodyRequest(
    req,
    res,
    'Submit complaint',
    'Complaint submitted successfully',
    ({ user, data }) => studentService.submitComplaint(user._id, data),
    201
);

const getFeeStatus = async (req, res) => runParamRequest(
    req,
    res,
    'Get student fee status',
    'Fee status retrieved successfully',
    ({ user, data }) => studentService.getFeeStatus(user._id, data)
);

const getHostelPolicies = async (req, res) => runParamRequest(
    req,
    res,
    'Get hostel policies',
    'Hostel policies retrieved successfully',
    ({ data }) => studentService.getHostelPolicies(data)
);

module.exports = {
    getProfile,
    updateProfile,
    getDashboard,
    getRoomAssignment,
    getLeaveRequests,
    submitLeaveRequest,
    getComplaints,
    submitComplaint,
    getFeeStatus,
    getHostelPolicies,
};
