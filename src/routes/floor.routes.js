const router = require('express').Router();
const controller = require('../controllers/floor.controller');

// GET endpoint
router.get('/all/:data', controller.getAllFloors);

module.exports = router;

