const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const passportJWT = require('passport-jwt');
const JWTStrategy = passportJWT.Strategy;
const ExtractJWT = passportJWT.ExtractJwt;
const bcrypt = require('bcryptjs');
const pool = require('./psql_config');
const dotenv = require('dotenv').config();

passport.use('local',
  new LocalStrategy((username, password, done) => {
    pool.query('SELECT username, password FROM "user" WHERE username=$1', [username], (err, result) => {
      const user = result.rows[0];
      if (err) {
        return done(err);
      };
      if (!user) {
        return done(null, false, {message: `There is no user named ${user.username} in the server`});
      };
      bcrypt.compare(password, user.password, (err, result) => {
        if (result) {
          // passwords match, login
          return done(null, user);
        } else {
          return done(null, false, {message: 'Password is incorrect'});
        }
      });
    })
  })
);

passport.use('jwt',
  new JWTStrategy({
    jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET
  },
  function (jwtPayload, cb) {
    pool.query('SELECT * FROM "user" WHERE username=$1', [jwtPayload.username], (err, result) => {
      const user = result.rows[0];
      if (err) {
        return cb(err);
      }
      return cb(null, user);
    })
  }
));

module.exports = passport;