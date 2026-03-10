const Parent = require('../../models/parent.model');
const { validateEncryptedRequest } = require('./requestValidator');

const validateParentRequest = async (req) => validateEncryptedRequest({
    req,
    model: Parent,
    expectedRole: 'parent',
    source: 'params',
    actorLabel: 'Parent',
});

const validateParentRequestBody = async (req) => validateEncryptedRequest({
    req,
    model: Parent,
    expectedRole: 'parent',
    source: 'body',
    actorLabel: 'Parent POST',
});

module.exports = {
    validateParentRequest,
    validateParentRequestBody,
};
