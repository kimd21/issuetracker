const router = require('express').Router();
const pool = require('../config/psql_config');
const { body, validationResult } = require('express-validator');
const passport = require('passport');
const bcrypt = require('bcryptjs');
const loginController = require('../controllers/loginController');

router.post('/', (req, res, next) => {
  // Body sanitization
  // body('first_name', 'First name must not be empty').trim().isLength({min: 1, max: 30}).escape();
  // body('last_name', 'Last name must not be empty').trim().isLength({min: 1, max: 30}).escape();
  body('username', 'Username must not be empty').trim().isLength({min: 1, max: 255}).escape();
  body('password', 'Password must must not be empty').trim().isLength({min: 1, max: 100}).escape();
  // body('email').isEmail().normalizeEmail();
  // body('birth_date', 'Birth date must not be empty').toDate().escape();

  const r = req.body;

  bcrypt.hash(r.password, 10, (err, hashpw) => {
    if (err) {next(err);}
    const values = [r.username, hashpw, 'Guest'];
    pool.query('INSERT INTO "user"(username, password, asignee, joined_on) VALUES ($1, $2, $3, NOW())', values, (err) => {
      if (err) {return next(err);}
      loginController.login_post(req, res, next);
    });
  });
  
});

module.exports = router;