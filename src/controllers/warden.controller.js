const { runParamRequest } = require('./_encryptedActorController');
const wardenService = require('../services/warden.service');

const getProfile = async (req, res) => runParamRequest({
    req,
    res,
    action: 'Get warden profile',
    successMessage: 'Profile retrieved successfully',
    allowedRoles: ['warden'],
    handler: ({ actor }) => wardenService.getProfile(actor.user._id),
});

const getDashboard = async (req, res) => runParamRequest({
    req,
    res,
    action: 'Get warden dashboard',
    successMessage: 'Dashboard retrieved successfully',
    allowedRoles: ['warden'],
    handler: ({ actor }) => wardenService.getDashboard(actor.user._id),
});

module.exports = {
    getProfile,
    getDashboard,
};

