const router = require('express').Router();
const controller = require('../controllers/manager.controller');
const auth = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

// Public
router.post('/register', controller.register);
router.post('/login', controller.login);

// Protected — Manager only
router.get('/profile', auth, authorize('MANAGER'), controller.getProfile);
router.put('/profile', auth, authorize('MANAGER'), controller.updateProfile);
router.get('/students', auth, authorize('MANAGER'), controller.getAllStudents);

// Manager creates users
router.post('/add/student', auth, authorize('MANAGER'), controller.createStudent);
router.post('/add/parent', auth, authorize('MANAGER'), controller.createParent);

// Manager gets user by ID
router.get('/student/:id', auth, authorize('MANAGER'), controller.getStudentById);
router.get('/parent/:id', auth, authorize('MANAGER'), controller.getParentById);

// Manager updates user
router.put('/student/:id', auth, authorize('MANAGER'), controller.updateStudent);
router.put('/parent/:id', auth, authorize('MANAGER'), controller.updateParent);

// Room assignment
router.post('/assign-room', auth, authorize('MANAGER'), controller.assignRoom);
router.get('/available-rooms', auth, authorize('MANAGER'), controller.getAvailableRooms);

module.exports = router;
