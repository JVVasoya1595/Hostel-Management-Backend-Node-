const router = require('express').Router();
const controller = require('../controllers/admin.controller');

router.get('/profile/:data', controller.getProfile);
router.get('/dashboard/:data', controller.getDashboard);
router.get('/managers/:data', controller.getAllManagers);
router.get('/students/:data', controller.getAllStudents);
router.get('/parents/:data', controller.getAllParents);
router.get('/floors/:data', controller.getAllFloors);
router.get('/rooms/available/:data', controller.getAvailableRooms);
router.get('/rooms/:data', controller.getAllRooms);
router.get('/fees/:data', controller.getFeePayments);
router.get('/notifications/:data', controller.getNotifications);

router.post('/managers', controller.createManager);
router.put('/managers', controller.updateManager);
router.delete('/managers', controller.deleteManager);

router.post('/students', controller.createStudent);
router.put('/students', controller.updateStudent);
router.delete('/students', controller.deleteStudent);

router.post('/parents', controller.createParent);
router.put('/parents', controller.updateParent);
router.delete('/parents', controller.deleteParent);

router.post('/floors', controller.createFloor);
router.put('/floors', controller.updateFloor);
router.delete('/floors', controller.deleteFloor);

router.post('/rooms', controller.createRoom);
router.put('/rooms', controller.updateRoom);
router.delete('/rooms', controller.deleteRoom);

router.post('/room-allocation', controller.assignRoom);
router.delete('/room-allocation', controller.unassignRoom);

router.post('/fees', controller.recordFeePayment);

router.post('/notifications', controller.createNotification);
router.delete('/notifications', controller.deleteNotification);

module.exports = router;
