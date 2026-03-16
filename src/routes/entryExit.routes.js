const router = require('express').Router();
const controller = require('../controllers/entryExit.controller');

router.get('/list/:data', controller.listEvents);
router.post('/record', controller.recordEvent);

module.exports = router;

