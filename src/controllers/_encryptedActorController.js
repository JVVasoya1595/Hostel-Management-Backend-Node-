const logger = require('../utils/logger');
const { encryptData } = require('../utils/encryption');
const {
    validateActorRequestParams,
    validateActorRequestBody,
} = require('../utils/validators/actor.validator');

const sendEncryptedResponse = (res, status, message, payload) => res.status(status).json({
    message,
    data: encryptData(payload),
});

const resolveErrorStatus = (error) => {
    const message = String(error.message || '').toLowerCase();
    if (message.includes('not found')) {
        return 404;
    }
    if (message.includes('unauthorized') || message.includes('forbidden')) {
        return 403;
    }
    if (message.includes('conflict') || message.includes('already exists')) {
        return 409;
    }
    return 400;
};

const handleActionError = (res, action, error) => {
    logger.error(`${action} failed:`, error);
    return res.status(resolveErrorStatus(error)).json({ message: error.message || 'SERVER ERROR' });
};

const runParamRequest = async ({
    req,
    res,
    action,
    successMessage,
    allowedRoles = null,
    handler,
    successStatus = 200,
}) => {
    try {
        logger.info(`${action} request received`);
        const validation = await validateActorRequestParams(req, {
            actorLabel: action,
            allowedRoles,
        });
        if (validation.error) {
            return res.status(validation.status).json({ message: validation.message });
        }

        const payload = await handler(validation);
        return sendEncryptedResponse(res, successStatus, successMessage, payload);
    } catch (error) {
        return handleActionError(res, action, error);
    }
};

const runBodyRequest = async ({
    req,
    res,
    action,
    successMessage,
    allowedRoles = null,
    handler,
    successStatus = 200,
}) => {
    try {
        logger.info(`${action} request received`);
        const validation = await validateActorRequestBody(req, {
            actorLabel: action,
            allowedRoles,
        });
        if (validation.error) {
            return res.status(validation.status).json({ message: validation.message });
        }

        const payload = await handler(validation);
        return sendEncryptedResponse(res, successStatus, successMessage, payload);
    } catch (error) {
        return handleActionError(res, action, error);
    }
};

module.exports = {
    sendEncryptedResponse,
    runParamRequest,
    runBodyRequest,
};

