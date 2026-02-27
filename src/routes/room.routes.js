const router = require('express').Router();
const controller = require('../controllers/room.controller');
const auth = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

// Admin can create rooms manually
router.post('/', auth, authorize('ADMIN'), controller.createRoom);  

// Both Admin and Manager can view rooms
router.get('/', auth, controller.getAllRooms);
router.get('/available', auth, controller.getAvailableRooms);

module.exports = router;
