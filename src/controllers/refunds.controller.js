const { runParamRequest, runBodyRequest } = require('./_encryptedActorController');
const refundService = require('../services/refund.service');

const listRefunds = async (req, res) => runParamRequest({
    req,
    res,
    action: 'List refund requests',
    successMessage: 'Refund requests retrieved successfully',
    allowedRoles: ['admin', 'manager', 'student'],
    handler: ({ actor, data }) => refundService.listRefundRequests(actor, data),
});

const submitRefund = async (req, res) => runBodyRequest({
    req,
    res,
    action: 'Submit refund request',
    successMessage: 'Refund request submitted successfully',
    allowedRoles: ['student'],
    successStatus: 201,
    handler: ({ actor, data }) => refundService.submitRefundRequest(actor.user._id, data),
});

const decideRefund = async (req, res) => runBodyRequest({
    req,
    res,
    action: 'Decide refund request',
    successMessage: 'Refund request updated successfully',
    allowedRoles: ['admin'],
    handler: ({ actor, data }) => refundService.decideRefundRequest(actor.user._id, data),
});

const markPaid = async (req, res) => runBodyRequest({
    req,
    res,
    action: 'Mark refund paid',
    successMessage: 'Refund marked as paid successfully',
    allowedRoles: ['admin'],
    handler: ({ actor, data }) => refundService.markRefundPaid(actor.user._id, data),
});

module.exports = {
    listRefunds,
    submitRefund,
    decideRefund,
    markPaid,
};

