const fs = require('fs');
const pg = require('pg');
const Pool = pg.Pool;
const dotenv = require('dotenv').config();

// Setup postgresql pool connetion
const pool = new Pool({
  user: process.env.PSQL_USER,
  host: process.env.PSQL_HOST,
  database: process.env.PSQL_DATABASE,
  password: process.env.PSQL_PASSWORD,
  port: process.env.PSQL_PORT
});

// Read in sql file
const sql = fs.readFileSync('../database/issuetracker.sql').toString();

// Split sql queries into an array to run individually in sequence
const sqlArr = sql.split(');');

// Remove last value (delimiter itself) from array
sqlArr.pop();

// Create postgres data types to build tables
const type_query = (
  `DO 
  $$
  BEGIN
    IF NOT EXISTS (SELECT * FROM pg_type) THEN
      CREATE TYPE TASK_TYPE AS ENUM ('task', 'request', 'bug');
      CREATE TYPE ASIGNEE AS ENUM ('Guest', 'Developer', 'ADMIN');
      CREATE TYPE STATUS AS ENUM ('open', 'closed', 'in progress', 'resolved');
      CREATE TYPE CATEGORY AS ENUM ('back end', 'front end');
      CREATE TYPE PRIORITY AS ENUM ('low', 'medium', 'high');
    END IF;
  END;
  $$`
);

pool.query(type_query, (err) => {
  if (err) {
    throw (err);
  }
});

// Run sql queries
sqlArr.forEach(sql_query => {
  // Add delimiter back in
  sql_query += ');';

  // Remove newline characters
  sql_query.replace(/\n/g, '');

  // Query the pool
  pool.query(sql_query, (err) => {
    if (err) {
      throw (err);
    }
  });
})

module.exports = pool;