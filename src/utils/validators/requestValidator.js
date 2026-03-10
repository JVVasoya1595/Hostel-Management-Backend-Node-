const jwt = require('jsonwebtoken');
const { decryptData } = require('../encryption');
const logger = require('../logger');

const normalizeRole = (value) => String(value || '').trim().toLowerCase();

const decodeNestedPayload = (cipherText) => {
    const outerPayload = decryptData(cipherText);
    if (outerPayload && typeof outerPayload === 'object' && outerPayload.data) {
        return decryptData(outerPayload.data);
    }

    return outerPayload;
};

const decodeRequestParams = (req) => {
    if (!req.params || !req.params.data) {
        throw new Error('Missing encrypted request data');
    }

    return decodeNestedPayload(req.params.data);
};

const decodeRequestBody = (req) => {
    if (!req.body || !req.body.data) {
        throw new Error('Missing encrypted request data');
    }

    const bodyCipher = decodeURIComponent(req.body.data);
    return decodeNestedPayload(bodyCipher);
};

const validateEncryptedRequest = async ({
    req,
    model,
    expectedRole,
    source,
    actorLabel,
}) => {
    try {
        logger.info(`${actorLabel} request validation started`);

        let requestData;
        try {
            requestData = source === 'body' ? decodeRequestBody(req) : decodeRequestParams(req);
        } catch (error) {
            logger.error(`Decryption failed: ${error.message}`);
            return { error: true, status: 400, message: 'Invalid data' };
        }

        const { token, id, email, role } = requestData || {};
        if (!token || !id) {
            return { error: true, status: 400, message: 'Missing authentication data' };
        }

        let decodedToken;
        try {
            decodedToken = jwt.verify(token, process.env.JWT_SECRET);
        } catch (error) {
            logger.warn('Invalid or expired token');
            return { error: true, status: 401, message: 'Unauthorized' };
        }

        const user = await model.findById(id);
        if (!user) {
            logger.warn('Authenticated user was not found');
            return { error: true, status: 403, message: 'Unauthorized' };
        }

        const requestedRole = normalizeRole(role);
        const tokenRole = normalizeRole(decodedToken.role);
        const storedRole = normalizeRole(user.role);
        if (requestedRole !== expectedRole || tokenRole !== expectedRole || storedRole !== expectedRole) {
            logger.warn('Role mismatch during request validation');
            return { error: true, status: 403, message: 'Unauthorized' };
        }

        if (String(decodedToken.id) !== String(id)) {
            logger.warn('Token subject mismatch during request validation');
            return { error: true, status: 403, message: 'Unauthorized' };
        }

        const normalizedEmail = String(email || user.email || '').trim().toLowerCase();
        const storedEmail = String(user.email || '').trim().toLowerCase();
        if (normalizedEmail && storedEmail && normalizedEmail !== storedEmail) {
            logger.warn('Email mismatch during request validation');
            return { error: true, status: 403, message: 'Unauthorized' };
        }

        if (decodedToken.email) {
            const tokenEmail = String(decodedToken.email).trim().toLowerCase();
            if (normalizedEmail && tokenEmail !== normalizedEmail) {
                logger.warn('Token email mismatch during request validation');
                return { error: true, status: 403, message: 'Unauthorized' };
            }
        }

        logger.info(`${actorLabel} request validated successfully`);
        return {
            error: false,
            user,
            data: requestData,
        };
    } catch (error) {
        logger.error('Validation error:', error);
        return { error: true, status: 500, message: 'Server Error' };
    }
};

module.exports = {
    validateEncryptedRequest,
};
