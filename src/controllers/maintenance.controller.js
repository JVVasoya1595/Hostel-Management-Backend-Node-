const { runParamRequest, runBodyRequest } = require('./_encryptedActorController');
const maintenanceService = require('../services/maintenance.service');

const listRequests = async (req, res) => runParamRequest({
    req,
    res,
    action: 'List maintenance requests',
    successMessage: 'Maintenance requests retrieved successfully',
    allowedRoles: ['admin', 'manager', 'warden', 'student'],
    handler: ({ actor, data }) => maintenanceService.listRequests(actor, data),
});

const createRequest = async (req, res) => runBodyRequest({
    req,
    res,
    action: 'Create maintenance request',
    successMessage: 'Maintenance request created successfully',
    allowedRoles: ['student'],
    successStatus: 201,
    handler: ({ actor, data }) => maintenanceService.createRequest(actor.user._id, data),
});

const assignRequest = async (req, res) => runBodyRequest({
    req,
    res,
    action: 'Assign maintenance request',
    successMessage: 'Maintenance request assigned successfully',
    allowedRoles: ['admin', 'manager', 'warden'],
    handler: ({ actor, data }) => maintenanceService.assignRequest(actor, data),
});

const updateStatus = async (req, res) => runBodyRequest({
    req,
    res,
    action: 'Update maintenance status',
    successMessage: 'Maintenance request updated successfully',
    allowedRoles: ['admin', 'manager', 'warden'],
    handler: ({ actor, data }) => maintenanceService.updateStatus(actor, data),
});

module.exports = {
    listRequests,
    createRequest,
    assignRequest,
    updateStatus,
};

