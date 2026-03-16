const router = require('express').Router();
const controller = require('../controllers/gatePass.controller');

router.get('/list/:data', controller.listGatePasses);
router.post('/request', controller.requestGatePass);
router.put('/parent-decision', controller.parentDecision);
router.put('/manager-decision', controller.managerDecision);

module.exports = router;

