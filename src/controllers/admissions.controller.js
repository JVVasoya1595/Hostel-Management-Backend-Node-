const { runParamRequest, runBodyRequest } = require('./_encryptedActorController');
const admissionsService = require('../services/admissions.service');

const listAdmissions = async (req, res) => runParamRequest({
    req,
    res,
    action: 'List admissions',
    successMessage: 'Admissions retrieved successfully',
    allowedRoles: ['admin', 'manager'],
    handler: ({ actor, data }) => admissionsService.listAdmissions(actor, data),
});

const createAdmission = async (req, res) => runBodyRequest({
    req,
    res,
    action: 'Create admission',
    successMessage: 'Admission created successfully',
    allowedRoles: ['manager'],
    successStatus: 201,
    handler: ({ actor, data }) => admissionsService.createAdmission(actor.user._id, data),
});

const updateAdmission = async (req, res) => runBodyRequest({
    req,
    res,
    action: 'Update admission',
    successMessage: 'Admission updated successfully',
    allowedRoles: ['manager'],
    handler: ({ actor, data }) => admissionsService.updateAdmission(actor.user._id, data),
});

const submitAdmission = async (req, res) => runBodyRequest({
    req,
    res,
    action: 'Submit admission',
    successMessage: 'Admission submitted successfully',
    allowedRoles: ['manager'],
    handler: ({ actor, data }) => admissionsService.submitAdmission(actor.user._id, data),
});

const decideAdmission = async (req, res) => runBodyRequest({
    req,
    res,
    action: 'Decide admission',
    successMessage: 'Admission decision saved successfully',
    allowedRoles: ['admin'],
    handler: ({ actor, data }) => admissionsService.decideAdmission(actor.user._id, data),
});

module.exports = {
    listAdmissions,
    createAdmission,
    updateAdmission,
    submitAdmission,
    decideAdmission,
};

