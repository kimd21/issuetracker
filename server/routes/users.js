const express = require('express');
const router = express.Router();
const pool = require('../config/psql_config');

/* GET users listing. */
router.get('/', function(req, res, next) {
  pool.query('SELECT * FROM users', (err, results) => {
    if (err) {
      throw (err);
    }
    res.status(200).json(results.rows);
  })
});

module.exports = router;
