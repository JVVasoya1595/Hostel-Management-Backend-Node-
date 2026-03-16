const router = require('express').Router();
const controller = require('../controllers/vehicles.controller');

router.get('/list/:data', controller.listVehicles);
router.post('/register', controller.registerVehicle);
router.put('/deactivate', controller.deactivateVehicle);

module.exports = router;

