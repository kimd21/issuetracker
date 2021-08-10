const pool = require('../config/psql_config');

exports.user_get = (req, res, next) => {
  pool.query('SELECT * FROM "user" WHERE id = $1', [req.params.userId], (err, result) => {
    const user = result.rows[0];
    if (err) {return next(err);}
    if (!user) {return res.status(400).send('User does not exist in database');}
    res.status(200).json(user);
  });
}