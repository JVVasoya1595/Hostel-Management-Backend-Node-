const { runParamRequest, runBodyRequest } = require('./_encryptedActorController');
const accessoryService = require('../services/accessory.service');

const listAccessories = async (req, res) => runParamRequest({
    req,
    res,
    action: 'List accessories',
    successMessage: 'Accessories retrieved successfully',
    allowedRoles: ['admin', 'manager'],
    handler: ({ data }) => accessoryService.listAccessories(data),
});

const issueAccessory = async (req, res) => runBodyRequest({
    req,
    res,
    action: 'Issue accessory',
    successMessage: 'Accessory issued successfully',
    allowedRoles: ['manager', 'admin'],
    successStatus: 201,
    handler: ({ actor, data }) => accessoryService.issueAccessory(actor.user._id, data),
});

const updateAccessoryStatus = async (req, res) => runBodyRequest({
    req,
    res,
    action: 'Update accessory status',
    successMessage: 'Accessory status updated successfully',
    allowedRoles: ['manager', 'admin'],
    handler: ({ actor, data }) => accessoryService.updateAccessoryStatus(actor.user._id, data),
});

module.exports = {
    listAccessories,
    issueAccessory,
    updateAccessoryStatus,
};

