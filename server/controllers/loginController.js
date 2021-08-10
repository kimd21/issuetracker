const passport = require('../config/passport_config');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv').config();

exports.login_post = (req, res, next) => {
  passport.authenticate('local', {session: false}, (err, user, info) => 
    {
      if (err || !user) {
        return res.status(400).json({
          message: 'Authentication failed',
          user: user,
        });
      }

      req.login(user, {session: false}, (err) => {
        if (err) {
          res.send(err);
        }

        // generate a signed JWT with contents of user object
        const token = jwt.sign(user, process.env.JWT_SECRET, {expiresIn: "2d"});
          return res.status(200).json({user, token});
      });
    }
  )(req, res, next);
};