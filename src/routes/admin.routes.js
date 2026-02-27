const router = require('express').Router();
const controller = require('../controllers/admin.controller');
const auth = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

// Public
router.post('/register', controller.register);
router.post('/login', controller.login);

// Protected — Admin only
router.get('/profile', auth, authorize('ADMIN'), controller.getProfile);
router.get('/students', auth, authorize('ADMIN'), controller.getAllStudents);
router.get('/managers', auth, authorize('ADMIN'), controller.getAllManagers);
router.get('/parents', auth, authorize('ADMIN'), controller.getAllParents);

// Admin creates users
router.post('/add/manager', auth, authorize('ADMIN'), controller.createManager);
router.post('/add/student', auth, authorize('ADMIN'), controller.createStudent);
router.post('/add/parent', auth, authorize('ADMIN'), controller.createParent);

// Admin gets user by ID
router.get('/manager/:id', auth, authorize('ADMIN'), controller.getManagerById);
router.get('/student/:id', auth, authorize('ADMIN'), controller.getStudentById);
router.get('/parent/:id', auth, authorize('ADMIN'), controller.getParentById);

// Admin updates user
router.put('/manager/:id', auth, authorize('ADMIN'), controller.updateManager);

module.exports = router;
