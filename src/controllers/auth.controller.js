const logger = require('../utils/logger');
const authService = require('../services/auth.service');

const sendResponse = (res, status, message, payload) => res.status(status).json({
    message,
    data: payload,
});

const resolveErrorStatus = (error) => {
    const message = String(error.message || '').toLowerCase();

    if (message.includes('already exists')) {
        return 409;
    }

    if (message.includes('invalid password')) {
        return 401;
    }

    if (message.includes('not found')) {
        return 404;
    }

    return 400;
};

const handleError = (res, action, error) => {
    logger.error(`${action} failed:`, error);
    return res.status(resolveErrorStatus(error)).json({
        message: error.message || 'SERVER ERROR',
    });
};

const createAuthHandler = ({ roleKey, action, operation, successStatus = 200 }) => async (req, res) => {
    try {
        logger.info(`${action} request received`);
        const result = await authService[operation](roleKey, req.body || {});
        return sendResponse(res, successStatus, result.message, {
            token: result.token,
            role: result.role,
            user: result.user,
            actor: result.actor,
        });
    } catch (error) {
        return handleError(res, action, error);
    }
};

const registerAdmin = createAuthHandler({
    roleKey: 'admin',
    action: 'Admin register',
    operation: 'register',
    successStatus: 201,
});

const loginAdmin = createAuthHandler({
    roleKey: 'admin',
    action: 'Admin login',
    operation: 'login',
});

const registerManager = createAuthHandler({
    roleKey: 'manager',
    action: 'Manager register',
    operation: 'register',
    successStatus: 201,
});

const loginManager = createAuthHandler({
    roleKey: 'manager',
    action: 'Manager login',
    operation: 'login',
});

const registerWarden = createAuthHandler({
    roleKey: 'warden',
    action: 'Warden register',
    operation: 'register',
    successStatus: 201,
});

const loginWarden = createAuthHandler({
    roleKey: 'warden',
    action: 'Warden login',
    operation: 'login',
});

const registerStudent = createAuthHandler({
    roleKey: 'student',
    action: 'Student register',
    operation: 'register',
    successStatus: 201,
});

const loginStudent = createAuthHandler({
    roleKey: 'student',
    action: 'Student login',
    operation: 'login',
});

const registerParent = createAuthHandler({
    roleKey: 'parent',
    action: 'Parent register',
    operation: 'register',
    successStatus: 201,
});

const loginParent = createAuthHandler({
    roleKey: 'parent',
    action: 'Parent login',
    operation: 'login',
});

module.exports = {
    registerAdmin,
    loginAdmin,
    registerManager,
    loginManager,
    registerWarden,
    loginWarden,
    registerStudent,
    loginStudent,
    registerParent,
    loginParent,
};
