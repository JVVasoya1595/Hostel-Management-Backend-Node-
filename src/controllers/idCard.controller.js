const { runParamRequest, runBodyRequest } = require('./_encryptedActorController');
const idCardService = require('../services/idCard.service');

const listCards = async (req, res) => runParamRequest({
    req,
    res,
    action: 'List ID cards',
    successMessage: 'ID cards retrieved successfully',
    allowedRoles: ['admin', 'manager'],
    handler: ({ data }) => idCardService.listCards(data),
});

const issueCard = async (req, res) => runBodyRequest({
    req,
    res,
    action: 'Issue ID card',
    successMessage: 'ID card issued successfully',
    allowedRoles: ['manager', 'admin'],
    successStatus: 201,
    handler: ({ actor, data }) => idCardService.issueCard(actor.user._id, data),
});

const replaceCard = async (req, res) => runBodyRequest({
    req,
    res,
    action: 'Replace ID card',
    successMessage: 'ID card replaced successfully',
    allowedRoles: ['manager', 'admin'],
    successStatus: 201,
    handler: ({ actor, data }) => idCardService.replaceCard(actor.user._id, data),
});

module.exports = {
    listCards,
    issueCard,
    replaceCard,
};

