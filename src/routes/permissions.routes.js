const router = require('express').Router();
const controller = require('../controllers/permissions.controller');

router.get('/list/:data', controller.listGrants);
router.put('/role-grant', controller.upsertRoleGrant);
router.put('/user-grant', controller.upsertUserGrant);

module.exports = router;

