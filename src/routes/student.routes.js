const router = require('express').Router();
const controller = require('../controllers/student.controller');

// GET endpoints - uses encrypted data in params
router.get('/profile/:data', controller.getProfile);
router.get('/fee-status/:data', controller.getFeeStatus);

// POST endpoints - uses encrypted data in body
router.post('/leave-request', controller.submitLeaveRequest);
router.post('/complaint', controller.submitComplaint);

module.exports = router;
