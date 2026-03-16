const router = require('express').Router();
const controller = require('../controllers/admissions.controller');

router.get('/list/:data', controller.listAdmissions);
router.post('/create', controller.createAdmission);
router.put('/update', controller.updateAdmission);
router.put('/submit', controller.submitAdmission);
router.put('/decision', controller.decideAdmission);

module.exports = router;

