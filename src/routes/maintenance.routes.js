const router = require('express').Router();
const controller = require('../controllers/maintenance.controller');

router.get('/list/:data', controller.listRequests);
router.post('/create', controller.createRequest);
router.put('/assign', controller.assignRequest);
router.put('/update-status', controller.updateStatus);

module.exports = router;

