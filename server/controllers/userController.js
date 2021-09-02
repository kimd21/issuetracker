const pool = require('../config/psql_config');

exports.user_getAll = async (req, res, next) => {
  let users_data;
  switch (req.user.asignee) {
    // ADMIN can access all profiles except other ADMINS
    case 'ADMIN':
      try {users_data = await pool.query('SELECT * FROM "user" WHERE asignee != $1', ['ADMIN']);}
      catch (err) {next(err);return;}
      break;
    // Developers can access all guests
    case 'Developer':
      try {users_data = await pool.query('SELECT * FROM "user" WHERE asignee = $1', ['Guest']);}
      catch (err) {next(err);return;}
      break;
    // Guests cannot access this route
    default:
      return res.status(403).send('Unauthorized access, permission denied');
  }

  // Get owner data
  let personal_data;
  try {personal_data = await pool.query('SELECT * FROM "user" WHERE id = $1', [req.user.id]);}
  catch (err) {next(err);return;}
  
  // Return owner data and all other accessible user data
  merged_data = Object.assign({}, [...users_data.rows, ...personal_data.rows]);
  res.status(200).json(merged_data);
}

exports.user_get = async (req, res, next) => {

  // Get id and role of user with userId
  let data;
  try {data = await pool.query('SELECT id, asignee FROM "user" WHERE id = $1', [req.params.userId]);}
  catch (err) {next(err);return;}

  // Data of user with userId
  const user = data.rows[0]; 
  if (user == undefined || null) {
    return res.status(400).send('User does not exist');
  }
  const user_id = user.id;
  const user_role = user.asignee;

  // Id of signed JWT user token
  const id = req.user.id;
  const role = req.user.asignee;

  // Query
  const query = 'SELECT * FROM "user" WHERE id = $1';

  let user_data;
  switch (role) {
    // 'ADMIN' can get all users' info except other 'ADMIN'
    case 'ADMIN':
      if (id === user_id || user_role !== 'ADMIN') {
        try {user_data = await pool.query(query, [user_id]);}
        catch (err) {next(err);return;}
        break;
      }
    // Developer can get all guest info
    case 'Developer':
      if (id === user_id || user_role === 'Guest') {
        try {user_data = await pool.query(query, [user_id]);}
        catch (err) {next(err);return;}
        break;
      }
    // Guest can only get their info
    case 'Guest':
      if (id === user_id) {
        try {user_data = await pool.query(query, [user_id]);}
        catch (err) {next(err);return;}
        break;
      }
    default:
      return res.status(403).send('Unauthorized access, permission denied');
  }
  res.status(200).json(user_data.rows[0]);
}

exports.user_post = async (req, res, next) => {
  // Id of signed JWT user token
  const role = req.user.asignee;

  // Query
  const r = req.body;
  const fields = [r.asignee, r.userName, r.password, r.firstName, r.lastName, r.birthDate, r.email];

  // Different first and second queries, second query is for posting a new user without going through the registration route
  // For the first query, if there is a conflict (i.e. username is null or not unique) then do nothing
  const query = `INSERT INTO "user"(asignee, username, password, first_name, last_name, birth_date, email, joined_on) 
  VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`;

  // Guests must create profile through registration route only
  switch (role) {
    // ADMIN can create users
    case 'ADMIN':
        try { await pool.query(query, fields);} 
        catch (err) {next(err); return;}
        break;
    // Developer can create users except ADMIN
    case 'Developer':
        if (r.asignee === 'ADMIN') {
          return res.status(403).send('Developers cannot create ADMIN accounts');
        }
        try { await pool.query(query, fields);} 
        catch (err) {next(err); return;}
        break;
    default:
      return res.status(403).send('Unauthorized access, permission denied');
  }
  res.status(200).send('User created successfully');
}

exports.user_put = async (req, res, next) => { 
  // Get id and role of user with userId
  let data;
  try {data = await pool.query('SELECT id, asignee FROM "user" WHERE id = $1', [req.params.userId]);}
  catch (err) {next(err);return;}

  // Data of user with userId
  const user = data.rows[0]; 
  if (user == undefined || null) {
    return res.status(400).send('User does not exist');
  }
  const user_id = user.id;
  const user_role = user.asignee;

  // Id of signed JWT user token
  const id = req.user.id;
  const role = req.user.asignee;

  // Query
  const r = req.body;
  const fields = [r.asignee, r.userName, r.password, r.firstName, r.lastName, r.birthDate, r.email, user_id];

  // If an input is null, don't update the value
  const query = `UPDATE "user" SET 
    asignee = COALESCE($1, asignee),
    username = COALESCE($2, username),
    password = COALESCE($3, password),
    first_name = COALESCE($4, first_name),
    last_name = COALESCE($5, last_name),
    birth_date = COALESCE($6, birth_date), 
    email = COALESCE($7, email) 
    WHERE id = $8`;

  // Owners can update their own account
  switch (role) {
    // ADMIN can update all users except other ADMIN
    case 'ADMIN':
      if (id === user_id || user_role !== 'ADMIN') {
        try {await pool.query(query, fields);}
        catch (err) {next(err);return;}
        break;
      }
    // Developer can update guest users
    case 'Developer':
      if (id === user_id || user_role === 'Guest') {
        try {await pool.query(query, fields);}
        catch (err) {next(err);return;}
        break;
      }
    // Guests cannot change roles
    case 'Guest':
      if (id === user_id) {
        try {await pool.query(query, ['Guest', fields.slice(1)]);}
        catch (err) {next(err);return;}
        break;
      }
    default:
      return res.status(403).send('Unauthorized access, permission denied');
  }
  res.status(200).json('User updated successfully');
}

exports.user_delete = async (req, res, next) => { 
  // Get id and role of user with userId
  let data;
  try {data = await pool.query('SELECT id, asignee FROM "user" WHERE id = $1', [req.params.userId]);}
  catch (err) {next(err);return;}

  // Data of user with userId
  const user = data.rows[0]; 
  if (user == undefined || null) {
    return res.status(400).send('User does not exist');
  }
  const user_id = user.id;
  const user_role = user.asignee;

  // Id of signed JWT user token
  const id = req.user.id;
  const role = req.user.asignee;

  // Query
  const query = 'DELETE FROM "user" WHERE id = $1';

  // All owners can delete their own account
  switch (role) {
    // ADMIN can delete everyone except other ADMIN
    case 'ADMIN':
      if (id === user_id || user_role !== 'ADMIN') {
        try {await pool.query(query, [user_id]);}
        catch (err) {next(err);return;}
        break;
      }
    // Developer can delete guests
    case 'Developer':
      if (id === user_id || user_role === 'Guest') {
        try {await pool.query(query, [user_id]);}
        catch (err) {next(err);return;}
        break;
      }
    // Guests cannot access this route
    default:
      return res.status(403).send('Unauthorized access, permission denied');
  }
  res.status(200).send('User was successfully deleted');
}