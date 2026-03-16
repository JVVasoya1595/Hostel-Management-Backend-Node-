const router = require('express').Router();
const controller = require('../controllers/auth.controller');

router.post('/admin/register', controller.registerAdmin);
router.post('/admin/login', controller.loginAdmin);

router.post('/manager/register', controller.registerManager);
router.post('/manager/login', controller.loginManager);

router.post('/warden/register', controller.registerWarden);
router.post('/warden/login', controller.loginWarden);

router.post('/student/register', controller.registerStudent);
router.post('/student/login', controller.loginStudent);

router.post('/parent/register', controller.registerParent);
router.post('/parent/login', controller.loginParent);

module.exports = router;
