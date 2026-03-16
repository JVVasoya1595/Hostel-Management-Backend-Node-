const router = require('express').Router();
const controller = require('../controllers/warden.controller');

router.get('/profile/:data', controller.getProfile);
router.get('/dashboard/:data', controller.getDashboard);

module.exports = router;

