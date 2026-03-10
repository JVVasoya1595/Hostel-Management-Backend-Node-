const logger = require('../utils/logger');
const { encryptData } = require('../utils/encryption');
const { validateAdminRequest, validateAdminRequestBody } = require('../utils/validators/admin.validator');
const adminService = require('../services/admin.service');

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
        const validation = await validateAdminRequest(req);
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
        const validation = await validateAdminRequestBody(req);
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
    'Get admin profile',
    'Profile retrieved successfully',
    ({ user }) => adminService.getProfile(user._id)
);

const getDashboard = async (req, res) => runParamRequest(
    req,
    res,
    'Get admin dashboard',
    'Dashboard overview retrieved successfully',
    () => adminService.getDashboard()
);

const getAllManagers = async (req, res) => runParamRequest(
    req,
    res,
    'Get all managers',
    'Managers retrieved successfully',
    () => adminService.getAllManagers()
);

const getAllStudents = async (req, res) => runParamRequest(
    req,
    res,
    'Get all students',
    'Students retrieved successfully',
    () => adminService.getAllStudents()
);

const getAllParents = async (req, res) => runParamRequest(
    req,
    res,
    'Get all parents',
    'Parents retrieved successfully',
    () => adminService.getAllParents()
);

const getAllFloors = async (req, res) => runParamRequest(
    req,
    res,
    'Get all floors',
    'Floors retrieved successfully',
    () => adminService.getAllFloors()
);

const getAllRooms = async (req, res) => runParamRequest(
    req,
    res,
    'Get all rooms',
    'Rooms retrieved successfully',
    () => adminService.getAllRooms()
);

const getAvailableRooms = async (req, res) => runParamRequest(
    req,
    res,
    'Get available rooms',
    'Available rooms retrieved successfully',
    () => adminService.getAvailableRooms()
);

const getFeePayments = async (req, res) => runParamRequest(
    req,
    res,
    'Get fee payments',
    'Fee payments retrieved successfully',
    () => adminService.getFeePayments()
);

const getNotifications = async (req, res) => runParamRequest(
    req,
    res,
    'Get notifications',
    'Notifications retrieved successfully',
    ({ data }) => adminService.getNotifications(data.limit)
);

const createManager = async (req, res) => runBodyRequest(
    req,
    res,
    'Create manager',
    'Manager created successfully',
    ({ data }) => adminService.createManager(data),
    201
);

const updateManager = async (req, res) => runBodyRequest(
    req,
    res,
    'Update manager',
    'Manager updated successfully',
    ({ data }) => adminService.updateManager(data)
);

const deleteManager = async (req, res) => runBodyRequest(
    req,
    res,
    'Delete manager',
    'Manager deleted successfully',
    ({ data }) => adminService.deleteManager(data)
);

const createStudent = async (req, res) => runBodyRequest(
    req,
    res,
    'Create student',
    'Student created successfully',
    ({ data }) => adminService.createStudent(data),
    201
);

const updateStudent = async (req, res) => runBodyRequest(
    req,
    res,
    'Update student',
    'Student updated successfully',
    ({ data }) => adminService.updateStudent(data)
);

const deleteStudent = async (req, res) => runBodyRequest(
    req,
    res,
    'Delete student',
    'Student deleted successfully',
    ({ data }) => adminService.deleteStudent(data)
);

const createParent = async (req, res) => runBodyRequest(
    req,
    res,
    'Create parent',
    'Parent created successfully',
    ({ data }) => adminService.createParent(data),
    201
);

const updateParent = async (req, res) => runBodyRequest(
    req,
    res,
    'Update parent',
    'Parent updated successfully',
    ({ data }) => adminService.updateParent(data)
);

const deleteParent = async (req, res) => runBodyRequest(
    req,
    res,
    'Delete parent',
    'Parent deleted successfully',
    ({ data }) => adminService.deleteParent(data)
);

const createFloor = async (req, res) => runBodyRequest(
    req,
    res,
    'Create floor',
    'Floor created successfully',
    ({ data }) => adminService.createFloor(data),
    201
);

const updateFloor = async (req, res) => runBodyRequest(
    req,
    res,
    'Update floor',
    'Floor updated successfully',
    ({ data }) => adminService.updateFloor(data)
);

const deleteFloor = async (req, res) => runBodyRequest(
    req,
    res,
    'Delete floor',
    'Floor deleted successfully',
    ({ data }) => adminService.deleteFloor(data)
);

const createRoom = async (req, res) => runBodyRequest(
    req,
    res,
    'Create room',
    'Room created successfully',
    ({ data }) => adminService.createRoom(data),
    201
);

const updateRoom = async (req, res) => runBodyRequest(
    req,
    res,
    'Update room',
    'Room updated successfully',
    ({ data }) => adminService.updateRoom(data)
);

const deleteRoom = async (req, res) => runBodyRequest(
    req,
    res,
    'Delete room',
    'Room deleted successfully',
    ({ data }) => adminService.deleteRoom(data)
);

const assignRoom = async (req, res) => runBodyRequest(
    req,
    res,
    'Assign room',
    'Room allocated successfully',
    ({ data }) => adminService.assignRoom(data)
);

const unassignRoom = async (req, res) => runBodyRequest(
    req,
    res,
    'Unassign room',
    'Room allocation removed successfully',
    ({ data }) => adminService.unassignRoom(data)
);

const recordFeePayment = async (req, res) => runBodyRequest(
    req,
    res,
    'Record fee payment',
    'Fee payment recorded successfully',
    ({ data }) => adminService.recordFeePayment(data)
);

const createNotification = async (req, res) => runBodyRequest(
    req,
    res,
    'Create notification',
    'Notification created successfully',
    ({ data, user }) => adminService.createNotification(data, user._id),
    201
);

const deleteNotification = async (req, res) => runBodyRequest(
    req,
    res,
    'Delete notification',
    'Notification deleted successfully',
    ({ data }) => adminService.deleteNotification(data)
);

module.exports = {
    getProfile,
    getDashboard,
    getAllManagers,
    getAllStudents,
    getAllParents,
    getAllFloors,
    getAllRooms,
    getAvailableRooms,
    getFeePayments,
    getNotifications,
    createManager,
    updateManager,
    deleteManager,
    createStudent,
    updateStudent,
    deleteStudent,
    createParent,
    updateParent,
    deleteParent,
    createFloor,
    updateFloor,
    deleteFloor,
    createRoom,
    updateRoom,
    deleteRoom,
    assignRoom,
    unassignRoom,
    recordFeePayment,
    createNotification,
    deleteNotification,
};
