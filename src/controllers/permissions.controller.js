const { runParamRequest, runBodyRequest } = require('./_encryptedActorController');
const permissionService = require('../services/permission.service');

const listGrants = async (req, res) => runParamRequest({
    req,
    res,
    action: 'List permission grants',
    successMessage: 'Permission grants retrieved successfully',
    allowedRoles: ['admin'],
    handler: ({ data }) => permissionService.listGrants(data),
});

const upsertRoleGrant = async (req, res) => runBodyRequest({
    req,
    res,
    action: 'Upsert role permission grant',
    successMessage: 'Role permission grant saved successfully',
    allowedRoles: ['admin'],
    handler: ({ actor, data }) => permissionService.upsertRoleGrant(actor.user._id, data),
});

const upsertUserGrant = async (req, res) => runBodyRequest({
    req,
    res,
    action: 'Upsert user permission grant',
    successMessage: 'User permission grant saved successfully',
    allowedRoles: ['admin'],
    handler: ({ actor, data }) => permissionService.upsertUserGrant(actor.user._id, data),
});

module.exports = {
    listGrants,
    upsertRoleGrant,
    upsertUserGrant,
};

