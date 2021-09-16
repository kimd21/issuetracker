const fs = require('fs').promises;
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

// Create postgres data types to build tables
const type_query = (
  `DO $$
  BEGIN
    CREATE TYPE TASK_TYPE AS ENUM ('task', 'request', 'bug');
    CREATE TYPE ASIGNEE AS ENUM ('Guest', 'Developer', 'ADMIN');
    CREATE TYPE STATUS AS ENUM ('open', 'closed', 'in progress', 'resolved');
    CREATE TYPE CATEGORY AS ENUM ('back end', 'front end');
    CREATE TYPE PRIORITY AS ENUM ('low', 'medium', 'high');
  EXCEPTION
    WHEN duplicate_object THEN null;
  END $$;`
);

// Split sql queries into an array to run individually in sequence
const delimeter = ');';

// IIFE async/await call (can't use top level await with CommonJS modules in NodeJS)
(async () => {
  // Read in sql file
  let data;
  try {data = await fs.readFile('../database/issuetracker.sql');}
  catch (err) {throw(err);}
  // Convert sql file to array of commands split by delimter (remove delimter itself from array)
  const sqlArr = data.toString().split(delimeter).pop();

  // Create types
  try {await pool.query(type_query);}
  catch (err) {throw(err);}
  // Run all sql queries
  for (let sql_query of sqlArr) {
    //Add delimiter back in
   sql_query += delimeter;

   // Remove newline characters
   sql_query.replace(/\n/g, '');

   // Query the pool
   try {await pool.query(sql_query);}
   catch (err) {throw(err);}
 }
})();

module.exports = pool;