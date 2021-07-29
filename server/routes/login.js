const router = require('express').Router();
const loginController = require('../controllers/loginController');

router.post('/', (req, res, next) => loginController.login_post(req, res, next));

module.exports = router;