const router = require('express').Router();
const controller = require('../controllers/documents.controller');

router.get('/list/:data', controller.listDocuments);
router.post('/upload', controller.uploadDocument);
router.put('/verify', controller.verifyDocument);

module.exports = router;

