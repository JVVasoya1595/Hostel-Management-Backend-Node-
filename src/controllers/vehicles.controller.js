const { runParamRequest, runBodyRequest } = require('./_encryptedActorController');
const vehicleService = require('../services/vehicle.service');

const listVehicles = async (req, res) => runParamRequest({
    req,
    res,
    action: 'List vehicles',
    successMessage: 'Vehicles retrieved successfully',
    allowedRoles: ['admin', 'manager'],
    handler: ({ data }) => vehicleService.listVehicles(data),
});

const registerVehicle = async (req, res) => runBodyRequest({
    req,
    res,
    action: 'Register vehicle',
    successMessage: 'Vehicle registered successfully',
    allowedRoles: ['manager', 'admin'],
    successStatus: 201,
    handler: ({ actor, data }) => vehicleService.registerVehicle(actor.user._id, data),
});

const deactivateVehicle = async (req, res) => runBodyRequest({
    req,
    res,
    action: 'Deactivate vehicle',
    successMessage: 'Vehicle deactivated successfully',
    allowedRoles: ['manager', 'admin'],
    handler: ({ actor, data }) => vehicleService.deactivateVehicle(actor.user._id, data),
});

module.exports = {
    listVehicles,
    registerVehicle,
    deactivateVehicle,
};

