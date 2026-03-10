const Admin = require('../../models/admin.model');
const { validateEncryptedRequest } = require('./requestValidator');

const validateAdminRequest = async (req) => validateEncryptedRequest({
    req,
    model: Admin,
    expectedRole: 'admin',
    source: 'params',
    actorLabel: 'Admin',
});

const validateAdminRequestBody = async (req) => validateEncryptedRequest({
    req,
    model: Admin,
    expectedRole: 'admin',
    source: 'body',
    actorLabel: 'Admin POST',
});

module.exports = {
    validateAdminRequest,
    validateAdminRequestBody,
};
