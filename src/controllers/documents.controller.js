const { runParamRequest, runBodyRequest } = require('./_encryptedActorController');
const documentsService = require('../services/documents.service');

const listDocuments = async (req, res) => runParamRequest({
    req,
    res,
    action: 'List documents',
    successMessage: 'Documents retrieved successfully',
    allowedRoles: ['admin', 'manager', 'warden'],
    handler: ({ data }) => documentsService.listDocuments(data),
});

const uploadDocument = async (req, res) => runBodyRequest({
    req,
    res,
    action: 'Upload document metadata',
    successMessage: 'Document uploaded successfully',
    allowedRoles: ['admin', 'manager', 'warden', 'student', 'parent'],
    successStatus: 201,
    handler: ({ actor, data }) => documentsService.uploadDocument(actor, data),
});

const verifyDocument = async (req, res) => runBodyRequest({
    req,
    res,
    action: 'Verify document',
    successMessage: 'Document verification updated successfully',
    allowedRoles: ['admin'],
    handler: ({ actor, data }) => documentsService.verifyDocument(actor.user._id, data),
});

module.exports = {
    listDocuments,
    uploadDocument,
    verifyDocument,
};

