const router = require('express').Router();
const controller = require('../controllers/floor.controller');
const auth = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

// Admin only
router.post('/', auth, authorize('ADMIN'), controller.createFloor);
router.get('/', auth, authorize('ADMIN'), controller.getAllFloors);
router.put('/:id', auth, authorize('ADMIN'), controller.updateFloor);
router.delete('/:id', auth, authorize('ADMIN'), controller.deleteFloor);

module.exports = router;
