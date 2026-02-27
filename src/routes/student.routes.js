const router = require('express').Router();
const controller = require('../controllers/student.controller');
const auth = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

// Public
router.post('/register', controller.register);
router.post('/login', controller.login);

// Protected — Student only
router.get('/profile', auth, authorize('STUDENT'), controller.getProfile);
router.get('/my-room', auth, authorize('STUDENT'), controller.getMyRoom);

// Forbidden — Students cannot create any users
router.post('/add/:userType', auth, (req, res) => {
    res.status(403).json({
        warning: 'Action Not Permitted',
        message: `As a STUDENT, you are not allowed to create a ${req.params.userType.toUpperCase()}. Only ADMIN or MANAGER roles can create users.`
    });
});

module.exports = router;
