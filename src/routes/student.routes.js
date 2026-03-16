const router = require('express').Router();
const controller = require('../controllers/student.controller');

router.get('/profile/:data', controller.getProfile);
router.put('/profile', controller.updateProfile);

router.get('/dashboard/:data', controller.getDashboard);
router.get('/room-assignment/:data', controller.getRoomAssignment);

router.get('/leave-requests/:data', controller.getLeaveRequests);
router.post('/leave-requests', controller.submitLeaveRequest);

router.get('/complaints/:data', controller.getComplaints);
router.post('/complaints', controller.submitComplaint);

router.get('/fees/:data', controller.getFeeStatus);
router.get('/notifications/:data', controller.getNotifications);
router.put('/notifications/read', controller.markNotificationsRead);
router.get('/policies/:data', controller.getHostelPolicies);

// Backward-compatible aliases for earlier Phase 1 student routes.
router.get('/fee-status/:data', controller.getFeeStatus);
router.post('/leave-request', controller.submitLeaveRequest);
router.post('/complaint', controller.submitComplaint);

module.exports = router;
