const router = require('express').Router();
const controller = require('../controllers/idCard.controller');

router.get('/list/:data', controller.listCards);
router.post('/issue', controller.issueCard);
router.post('/replace', controller.replaceCard);

module.exports = router;

