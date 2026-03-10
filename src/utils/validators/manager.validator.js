const Manager = require('../../models/manager.model');
const { validateEncryptedRequest } = require('./requestValidator');

const validateManagerRequest = async (req) => validateEncryptedRequest({
    req,
    model: Manager,
    expectedRole: 'manager',
    source: 'params',
    actorLabel: 'Manager',
});

const validateManagerRequestBody = async (req) => validateEncryptedRequest({
    req,
    model: Manager,
    expectedRole: 'manager',
    source: 'body',
    actorLabel: 'Manager POST',
});

module.exports = {
    validateManagerRequest,
    validateManagerRequestBody,
};
