const router = require('express').Router();
const controller = require('../controllers/manager.controller');

router.get('/profile/:data', controller.getProfile);
router.get('/dashboard/:data', controller.getDashboard);
router.get('/assignment/:data', controller.getAssignmentOverview);
router.get('/students/:data', controller.getAllStudents);
router.put('/students', controller.updateStudentInfo);

router.post('/check-in', controller.checkInStudent);
router.post('/check-out', controller.checkOutStudent);
router.get('/rooms/vacancy/:data', controller.getRoomVacancy);

router.get('/leave-requests/:data', controller.getLeaveRequests);
router.get('/complaints/:data', controller.getComplaints);
router.put('/complaints', controller.updateComplaint);

router.post('/attendance', controller.recordAttendance);
router.get('/attendance/:data', controller.getAttendanceReport);

module.exports = router;
