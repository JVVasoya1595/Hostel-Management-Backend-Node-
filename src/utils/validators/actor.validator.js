const jwt = require('jsonwebtoken');
const logger = require('../logger');
const { decryptData } = require('../encryption');

const Admin = require('../../models/admin.model');
const Manager = require('../../models/manager.model');
const Student = require('../../models/student.model');
const Parent = require('../../models/parent.model');
const Warden = require('../../models/warden.model');

const ROLE_MODELS = {
    admin: Admin,
    manager: Manager,
    warden: Warden,
    student: Student,
    parent: Parent,
};

const normalizeRole = (value) => String(value || '').trim().toLowerCase();

const safeDecodeURIComponent = (value) => {
    if (typeof value !== 'string') {
        return value;
    }

    try {
        return decodeURIComponent(value);
    } catch {
        return value;
    }
};

const getJwtSecretForRole = (role) => {
    const normalizedRole = normalizeRole(role);
    const envKey = `${normalizedRole.toUpperCase()}_JWT_SECRET`;
    return process.env[envKey] || process.env.JWT_SECRET;
};

const decodeNestedPayload = (cipherText) => {
    const outerPayload = decryptData(safeDecodeURIComponent(cipherText));
    if (outerPayload && typeof outerPayload === 'object' && outerPayload.data) {
        return decryptData(safeDecodeURIComponent(outerPayload.data));
    }

    return outerPayload;
};

const decodeRequestParams = (req) => {
    if (!req.params || !req.params.data) {
        throw new Error('Missing encrypted request data');
    }

    // Route params are often URL-encoded.
    const cipherText = safeDecodeURIComponent(req.params.data);
    return decodeNestedPayload(cipherText);
};

const decodeRequestBody = (req) => {
    if (!req.body || !req.body.data) {
        throw new Error('Missing encrypted request data');
    }

    const cipherText = decodeURIComponent(req.body.data);
    return decodeNestedPayload(cipherText);
};

const validateActorRequest = async ({
    req,
    source,
    allowedRoles = null,
    actorLabel = 'Actor',
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
        if (!token || !id || !role) {
            return { error: true, status: 400, message: 'Missing authentication data' };
        }

        const requestedRole = normalizeRole(role);
        if (allowedRoles && allowedRoles.length && !allowedRoles.includes(requestedRole)) {
            return { error: true, status: 403, message: 'Unauthorized' };
        }

        const Model = ROLE_MODELS[requestedRole];
        if (!Model) {
            return { error: true, status: 400, message: 'Unsupported role' };
        }

        let decodedToken;
        try {
            const jwtSecret = getJwtSecretForRole(requestedRole);
            if (!jwtSecret) {
                return { error: true, status: 500, message: 'Server Error' };
            }

            decodedToken = jwt.verify(token, jwtSecret);
        } catch (error) {
            logger.warn('Invalid or expired token');
            return { error: true, status: 401, message: 'Unauthorized' };
        }

        const tokenRole = normalizeRole(decodedToken.role);
        if (tokenRole !== requestedRole) {
            logger.warn('Role mismatch during request validation');
            return { error: true, status: 403, message: 'Unauthorized' };
        }

        if (String(decodedToken.id) !== String(id)) {
            logger.warn('Token subject mismatch during request validation');
            return { error: true, status: 403, message: 'Unauthorized' };
        }

        const user = await Model.findById(id);
        if (!user) {
            logger.warn('Authenticated user was not found');
            return { error: true, status: 403, message: 'Unauthorized' };
        }

        const normalizedEmail = String(email || user.email || '').trim().toLowerCase();
        const storedEmail = String(user.email || '').trim().toLowerCase();
        if (normalizedEmail && storedEmail && normalizedEmail !== storedEmail) {
            logger.warn('Email mismatch during request validation');
            return { error: true, status: 403, message: 'Unauthorized' };
        }

        const requestedPhone = String(requestData.mobile_no || requestData.phone || '').trim();
        if (requestedPhone) {
            const storedPhone = String(user.mobile_no || user.phone || '').trim();
            if (storedPhone && requestedPhone !== storedPhone) {
                logger.warn('Phone mismatch during request validation');
                return { error: true, status: 403, message: 'Unauthorized' };
            }

            if (decodedToken.mobile_no || decodedToken.phone) {
                const tokenPhone = String(decodedToken.mobile_no || decodedToken.phone || '').trim();
                if (tokenPhone && requestedPhone !== tokenPhone) {
                    logger.warn('Token phone mismatch during request validation');
                    return { error: true, status: 403, message: 'Unauthorized' };
                }
            }
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
            actor: {
                role: requestedRole,
                user,
                token,
            },
            data: requestData,
        };
    } catch (error) {
        logger.error('Validation error:', error);
        return { error: true, status: 500, message: 'Server Error' };
    }
};

const validateActorRequestParams = async (req, options = {}) => validateActorRequest({
    req,
    source: 'params',
    actorLabel: options.actorLabel || 'Actor',
    allowedRoles: options.allowedRoles || null,
});

const validateActorRequestBody = async (req, options = {}) => validateActorRequest({
    req,
    source: 'body',
    actorLabel: options.actorLabel || 'Actor POST',
    allowedRoles: options.allowedRoles || null,
});

module.exports = {
    validateActorRequest,
    validateActorRequestParams,
    validateActorRequestBody,
};
