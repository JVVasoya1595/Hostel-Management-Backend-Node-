const router = require('express').Router();
const controller = require('../controllers/parent.controller');

router.get('/profile/:data', controller.getProfile);
router.put('/profile', controller.updateProfile);

router.get('/dashboard/:data', controller.getDashboard);
router.get('/students/:data', controller.getStudents);
router.get('/student-status/:data', controller.getStudents);

router.get('/fees/:data', controller.getFeeHistory);
router.get('/complaints/:data', controller.getComplaints);

router.get('/communications/:data', controller.getCommunications);
router.post('/communications', controller.createCommunication);
router.get('/notifications/:data', controller.getNotifications);
router.put('/notifications/read', controller.markNotificationsRead);

router.get('/emergency-contacts/:data', controller.getEmergencyContacts);
router.put('/emergency-contacts', controller.updateEmergencyContacts);

// Backward-compatible aliases for the earlier parent module surface.
router.get('/child-info/:data', controller.getStudents);
router.get('/child-fee-status/:data', controller.getFeeHistory);
router.get('/child-complaints/:data', controller.getComplaints);

module.exports = router;
