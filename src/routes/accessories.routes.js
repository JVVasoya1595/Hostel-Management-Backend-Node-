const router = require('express').Router();
const controller = require('../controllers/accessories.controller');

router.get('/list/:data', controller.listAccessories);
router.post('/issue', controller.issueAccessory);
router.put('/update-status', controller.updateAccessoryStatus);

module.exports = router;

