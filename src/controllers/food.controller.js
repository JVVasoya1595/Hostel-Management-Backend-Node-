const { runParamRequest, runBodyRequest } = require('./_encryptedActorController');
const foodService = require('../services/food.service');

const getMenu = async (req, res) => runParamRequest({
    req,
    res,
    action: 'Get food menu',
    successMessage: 'Food menu retrieved successfully',
    allowedRoles: ['admin', 'manager', 'student', 'parent'],
    handler: ({ data }) => foodService.getMenu(data),
});

const publishMenu = async (req, res) => runBodyRequest({
    req,
    res,
    action: 'Publish food menu',
    successMessage: 'Food menu published successfully',
    allowedRoles: ['admin', 'manager'],
    handler: ({ actor, data }) => foodService.publishMenu(actor, data),
});

const markFoodSlots = async (req, res) => runBodyRequest({
    req,
    res,
    action: 'Mark food slots',
    successMessage: 'Food slots marked successfully',
    allowedRoles: ['student'],
    handler: ({ actor, data }) => foodService.markFoodSlots(actor.user._id, data),
});

const getReport = async (req, res) => runParamRequest({
    req,
    res,
    action: 'Get food slot report',
    successMessage: 'Food slot report retrieved successfully',
    allowedRoles: ['admin', 'manager'],
    handler: ({ data }) => foodService.getReport(data),
});

module.exports = {
    getMenu,
    publishMenu,
    markFoodSlots,
    getReport,
};

