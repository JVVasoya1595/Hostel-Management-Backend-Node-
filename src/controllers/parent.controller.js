const logger = require('../utils/logger');
const { encryptData } = require('../utils/encryption');
const { validateParentRequest, validateParentRequestBody } = require('../utils/validators/parent.validator');
const parentService = require('../services/parent.service');

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

    if (message.includes('not linked')) {
        return 403;
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
        const validation = await validateParentRequest(req);
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
        const validation = await validateParentRequestBody(req);
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
    'Get parent profile',
    'Profile retrieved successfully',
    ({ user }) => parentService.getProfile(user._id)
);

const updateProfile = async (req, res) => runBodyRequest(
    req,
    res,
    'Update parent profile',
    'Profile updated successfully',
    ({ user, data }) => parentService.updateProfile(user._id, data)
);

const getDashboard = async (req, res) => runParamRequest(
    req,
    res,
    'Get parent dashboard',
    'Dashboard retrieved successfully',
    ({ user }) => parentService.getDashboard(user._id)
);

const getStudents = async (req, res) => runParamRequest(
    req,
    res,
    'Get linked students',
    'Linked students retrieved successfully',
    ({ user, data }) => parentService.getStudents(user._id, data)
);

const getFeeHistory = async (req, res) => runParamRequest(
    req,
    res,
    'Get child fee history',
    'Fee history retrieved successfully',
    ({ user, data }) => parentService.getFeeHistory(user._id, data)
);

const getComplaints = async (req, res) => runParamRequest(
    req,
    res,
    'Get child complaints',
    'Complaints retrieved successfully',
    ({ user, data }) => parentService.getComplaints(user._id, data)
);

const getCommunications = async (req, res) => runParamRequest(
    req,
    res,
    'Get parent communications',
    'Communications retrieved successfully',
    ({ user, data }) => parentService.getCommunications(user._id, data)
);

const createCommunication = async (req, res) => runBodyRequest(
    req,
    res,
    'Create parent communication',
    'Communication submitted successfully',
    ({ user, data }) => parentService.createCommunication(user._id, data),
    201
);

const getEmergencyContacts = async (req, res) => runParamRequest(
    req,
    res,
    'Get emergency contacts',
    'Emergency contacts retrieved successfully',
    ({ user }) => parentService.getEmergencyContacts(user._id)
);

const updateEmergencyContacts = async (req, res) => runBodyRequest(
    req,
    res,
    'Update emergency contacts',
    'Emergency contacts updated successfully',
    ({ user, data }) => parentService.updateEmergencyContacts(user._id, data)
);

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
