const router = require('express').Router();
const controller = require('../controllers/refunds.controller');

router.get('/list/:data', controller.listRefunds);
router.post('/request', controller.submitRefund);
router.put('/decision', controller.decideRefund);
router.put('/mark-paid', controller.markPaid);

module.exports = router;

