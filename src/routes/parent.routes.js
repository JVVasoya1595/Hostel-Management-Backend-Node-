const router = require('express').Router();
const controller = require('../controllers/parent.controller');

// GET endpoints - uses encrypted data in params
router.get('/profile/:data', controller.getProfile);
router.get('/child-info/:data', controller.getChildInfo);
router.get('/child-fee-status/:data', controller.getChildFeeStatus);
router.get('/child-complaints/:data', controller.getChildComplaints);

module.exports = router;

