const router = require('express').Router();
const controller = require('../controllers/parent.controller');
const auth = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

// Public
router.post('/register', controller.register);
router.post('/login', controller.login);

// Protected — Parent only
router.get('/profile', auth, authorize('PARENT'), controller.getProfile);

// Forbidden — Parents cannot create any users
router.post('/add/:userType', auth, (req, res) => {
    res.status(403).json({
        warning: 'Action Not Permitted',
        message: `As a PARENT, you are not allowed to create a ${req.params.userType.toUpperCase()}. Only ADMIN or MANAGER roles can create users.`
    });
});

module.exports = router;
