const pool = require('../config/psql_config');
const bcrypt = require('bcryptjs');

const queryfn = async(query, fields) => {
    let data = await pool.query(query, fields).catch(err => {throw(err);})
    return data.rows;
}

exports.user_getAll = async (req, res, next) => {
  let users_data;
  switch (req.user.asignee) {
    // ADMIN can access all profiles except other ADMINS
    case 'ADMIN':
      try {users_data = await queryfn('SELECT * FROM "user" WHERE asignee != $1', ['ADMIN']);}
      catch (err) {return next(err);} break;
    // Developers can access all guests
    case 'Developer':
      try {users_data = await queryfn('SELECT * FROM "user" WHERE asignee = $1', ['Guest']);}
      catch (err) {return next(err);} break;
    // Guests cannot access this route
    default:
      return res.status(403).send('Unauthorized access, permission denied');
  }

  // Get owner data
  let personal_data;
  try {personal_data = await queryfn('SELECT * FROM "user" WHERE id = $1', [req.user.id]);}
  catch (err) {return next(err);}
  
  // Return owner data and all other accessible user data
  let merged_data = Object.assign({}, [...users_data, ...personal_data]);
  res.status(200).json(merged_data);
}

exports.user_get = async (req, res, next) => {

  // Get id and role of user with userId
  let data;
  try {data = await queryfn('SELECT id, asignee FROM "user" WHERE id = $1', [req.params.userId]);}
  catch (err) {return next(err);}
  // Data of user with userId 
  if (!data?.length) {
    return res.status(400).send('User does not exist');
  }

  const user = data[0];
  const user_id = user.id;
  const user_role = user.asignee;

  // Id of signed JWT user token
  const id = req.user.id;
  const role = req.user.asignee;

  // Query
  const query = 'SELECT * FROM "user" WHERE id = $1';
  const fields = [user_id];

  let user_data;
  switch (role) {
    // 'ADMIN' can get all users' info except other 'ADMIN'
    case 'ADMIN':
      if (id === user_id || user_role !== 'ADMIN') {
        try {user_data = await queryfn(query, fields);}
        catch (err) {return next(err);} break;
      }
    // Developer can get all guest info
    case 'Developer':
      if (id === user_id || user_role === 'Guest') {
        try {user_data = await queryfn(query, fields);}
        catch (err) {return next(err);} break;
      }
    // Guest can only get their info
    case 'Guest':
      if (id === user_id) {
        try {user_data = await queryfn(query, fields);}
        catch (err) {return next(err);} break;
      }
    default:
      return res.status(403).send('Unauthorized access, permission denied');
  }
  res.status(200).json(user_data[0]);
}

exports.user_post = async (req, res, next) => {
  // Id of signed JWT user token
  const role = req.user.asignee;

  // QUERY
  const r = req.body;
  // Hash the password
  let hashpw;
  if (!r.password?.length) {
    hashpw = '';
  } else {
    hashpw = await bcrypt.hash(r.password, 10);
  }
  const fields = [r.asignee, r.userName, hashpw, r.firstName, r.lastName, r.birthDate, r.email];

  // Different first and second queries, second query is for posting a new user without going through the registration route
  // For the first query, if there is a conflict (i.e. username is null or not unique) then do nothing
  const query = `INSERT INTO "user"(asignee, username, password, first_name, last_name, birth_date, email, joined_on) 
  VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`;

  // Guests must create profile through registration route only
  switch (role) {
    // ADMIN can create users
    case 'ADMIN':
        try {await queryfn(query, fields);}
        catch (err) {return next(err);} break;
    // Developer can create users except ADMIN
    case 'Developer':
        if (r.asignee === 'ADMIN') {
          return res.status(403).send('Developers cannot create ADMIN accounts');
        }
        try {await queryfn(query, fields);}
        catch (err) {return next(err);} break;
    default:
      return res.status(403).send('Unauthorized access, permission denied');
  }
  res.status(201).send('User created successfully');
}

exports.user_put = async (req, res, next) => { 
  // Get id and role of user with userId
  let data;
  try {data = await queryfn('SELECT id, asignee FROM "user" WHERE id = $1', [req.params.userId]);}
  catch (err) {return next(err);}

  // Data of user with userId
  if (!data?.length) {
    return res.status(400).send('User does not exist');
  }
  const user = data[0]; 
  const user_id = user.id;
  const user_role = user.asignee;

  // Id of signed JWT user token
  const id = req.user.id;
  const role = req.user.asignee;

  // Query
  const r = req.body;
  // Hash the password
  let hashpw;
  if (!r.password?.length) {
    hashpw = '';
  } else {
    hashpw = await bcrypt.hash(r.password, 10);
  }
  const fields = [r.asignee, r.userName, hashpw, r.firstName, r.lastName, r.birthDate, r.email, user_id];

  // If an input is null, don't update the value
  const query = `UPDATE "user" SET 
    asignee = COALESCE(NULLIF($1, '')::ASIGNEE, asignee),
    username = COALESCE(NULLIF($2, ''), username),
    password = COALESCE(NULLIF($3, ''), password),
    first_name = COALESCE(NULLIF($4, ''), first_name),
    last_name = COALESCE(NULLIF($5, ''), last_name),
    birth_date = COALESCE(NULLIF($6, '')::TIMESTAMPTZ, birth_date), 
    email = COALESCE(NULLIF($7, ''), email) 
    WHERE id = $8`;

  // Owners can update their own account
  switch (role) {
    // ADMIN can update all users except other ADMIN
    case 'ADMIN':
      if (id === user_id || user_role !== 'ADMIN') {
        try {await queryfn(query, fields);}
        catch (err) {return next(err);} break;
      }
    // Developer can update guest users
    case 'Developer':
      if (id === user_id || user_role === 'Guest') {
        try {await queryfn(query, fields);}
        catch (err) {return next(err);} break;
      }
    // Guests cannot change roles
    case 'Guest':
      if (id === user_id) {
        try {await queryfn(query, ['Guest', fields.slice(1)]);}
        catch (err) {return next(err);} break;
      }
    default:
      return res.status(403).send('Unauthorized access, permission denied');
  }
  res.status(200).json('User updated successfully');
}

exports.user_delete = async (req, res, next) => { 
  // Get id and role of user with userId
  let data;
  try {data = await queryfn('SELECT id, asignee FROM "user" WHERE id = $1', [req.params.userId]);}
  catch (err) {return next(err);}

  // Data of user with userId
  if (!data?.length) {
    return res.status(400).send('User does not exist');
  }

  const user = data[0];
  const user_id = user.id;
  const user_role = user.asignee;

  // Id of signed JWT user token
  const id = req.user.id;
  const role = req.user.asignee;

  // Query
  const query = 'DELETE FROM "user" WHERE id = $1';
  const fields = [user_id];

  // All owners can delete their own account
  switch (role) {
    // ADMIN can delete everyone except other ADMIN
    case 'ADMIN':
      if (id === user_id || user_role !== 'ADMIN') {
        try {await queryfn(query, fields);}
        catch (err) {return next(err);} break;
      }
    // Developer can delete guests
    case 'Developer':
      if (id === user_id || user_role === 'Guest') {
        try {await queryfn(query, fields);}
        catch (err) {return next(err);} break;
      }
    // Guests cannot access this route
    default:
      return res.status(403).send('Unauthorized access, permission denied');
  }
  res.status(200).send('User was successfully deleted');
}