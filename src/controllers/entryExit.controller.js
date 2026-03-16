const { runParamRequest, runBodyRequest } = require('./_encryptedActorController');
const entryExitService = require('../services/entryExit.service');

const listEvents = async (req, res) => runParamRequest({
    req,
    res,
    action: 'List entry exit logs',
    successMessage: 'Entry exit logs retrieved successfully',
    allowedRoles: ['admin', 'manager', 'warden'],
    handler: ({ actor, data }) => entryExitService.listEvents(actor, data),
});

const recordEvent = async (req, res) => runBodyRequest({
    req,
    res,
    action: 'Record entry exit event',
    successMessage: 'Entry exit event recorded successfully',
    allowedRoles: ['admin', 'manager', 'warden'],
    successStatus: 201,
    handler: ({ actor, data }) => entryExitService.recordEvent(actor, data),
});

module.exports = {
    listEvents,
    recordEvent,
};

