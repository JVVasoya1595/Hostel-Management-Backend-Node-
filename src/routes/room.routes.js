const router = require('express').Router();
const controller = require('../controllers/room.controller');

// GET endpoints
router.get('/all/:data', controller.getAllRooms);
router.get('/available/:data', controller.getAvailableRooms);

module.exports = router;

