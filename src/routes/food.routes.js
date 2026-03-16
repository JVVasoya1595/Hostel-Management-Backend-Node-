const router = require('express').Router();
const controller = require('../controllers/food.controller');

router.get('/menu/:data', controller.getMenu);
router.post('/menu/publish', controller.publishMenu);
router.post('/mark', controller.markFoodSlots);
router.get('/report/:data', controller.getReport);

module.exports = router;

