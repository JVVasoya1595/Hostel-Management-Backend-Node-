const { runParamRequest, runBodyRequest } = require('./_encryptedActorController');
const gatePassService = require('../services/gatePass.service');

const listGatePasses = async (req, res) => runParamRequest({
    req,
    res,
    action: 'List gate passes',
    successMessage: 'Gate passes retrieved successfully',
    allowedRoles: ['admin', 'manager', 'warden', 'student', 'parent'],
    handler: ({ actor, data }) => gatePassService.listGatePasses(actor, data),
});

const requestGatePass = async (req, res) => runBodyRequest({
    req,
    res,
    action: 'Request gate pass',
    successMessage: 'Gate pass requested successfully',
    allowedRoles: ['student'],
    successStatus: 201,
    handler: ({ actor, data }) => gatePassService.requestGatePass(actor.user._id, data),
});

const parentDecision = async (req, res) => runBodyRequest({
    req,
    res,
    action: 'Parent gate pass decision',
    successMessage: 'Gate pass decision recorded successfully',
    allowedRoles: ['parent'],
    handler: ({ actor, data }) => gatePassService.parentDecision(actor.user._id, data),
});

const managerDecision = async (req, res) => runBodyRequest({
    req,
    res,
    action: 'Manager gate pass decision',
    successMessage: 'Gate pass decision recorded successfully',
    allowedRoles: ['manager'],
    handler: ({ actor, data }) => gatePassService.managerDecision(actor.user._id, data),
});

module.exports = {
    listGatePasses,
    requestGatePass,
    parentDecision,
    managerDecision,
};

