const pool = require('../config/psql_config');

const queryfn = async(query, fields) => {
    let data = await pool.query(query, fields).catch(err => {throw(err);})
    return data.rows;
}

exports.issue_getAll = async (req, res, next) => {
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

  const query = 'SELECT issue.* FROM issue NATURAL JOIN "user" WHERE id = $1';
  const fields = [req.params.userId];

  let issues_data;
  switch (role) {
    // 'ADMIN' can access all profiles except other ADMINS
    case 'ADMIN':
      if (id === user_id || user_role !== 'ADMIN') {
        try {issues_data = await queryfn(query, fields);}
        catch (err) {return next(err);} break;
      }
    // 'Developer' can access all guests
    case 'Developer':
      if (id === user_id || user_role === 'Guest') {
        try {issues_data = await queryfn(query, fields);}
        catch (err) {return next(err);} break;
      }
    case 'Guest':
      if (id === user_id) {
        try {issues_data = await queryfn(query, fields);}
        catch (err) {return next(err);} break;
      }
    default:
      return res.status(403).send('Unauthorized access, permission denied');
  }

  // Convert to object
  let issues = Object.assign({}, [...issues_data]);

  res.status(200).json(issues);
}

exports.issue_get = async (req, res, next) => {

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
  const query = 'SELECT * FROM issue WHERE issue_id = $1';
  const fields = [req.params.issueId];

  let issue_data;
  switch (role) {
    // If 'ADMIN', send data only if owner or not ADMIN
    case 'ADMIN':
      if (id === user_id || user_role !== 'ADMIN') {
        try {issue_data = await queryfn(query, fields);}
        catch (err) {return next(err);} break;
      }
    // If 'Developer', send data only if owner or guest
    case 'Developer':
      if (id === user_id || user_role === 'Guest') {
        try {issue_data = await queryfn(query, fields);}
        catch (err) {return next(err);} break;
      }
    // If 'Guest', send data only if owner
    case 'Guest':
      if (id === user_id) {
        try {issue_data = await queryfn(query, fields);}
        catch (err) {return next(err);} break;
      }
    default:
      return res.status(403).send('Unauthorized access, permission denied');
  }

  if (!issue_data?.length) {
    return res.status(400).send('Issue does not exist');
  }

  res.status(200).json(issue_data[0]);
}

exports.issue_post = async (req, res, next) => {

  // Get id and role of user with userId
  let data; 
  try {data = await queryfn('SELECT id, asignee FROM "user" WHERE id = $1', [req.params.userId]);}
  catch (err) {next(err);return;}

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
  const fields = [r.problem_title, r.problem, user_id, r.task_type, r.status, r.category, 
    1.0, r.priority, r.due_date, req.user.username];
  const query = `INSERT INTO issue(problem_title, problem, id, task_type, status, category, 
    version, priority, due_date, registered_by, created_at) 
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())`;
  
  // All owners can post to their own account
  switch (role) {
    // ADMIN can post to everyone except other ADMINs
    case 'ADMIN':
      if (id === user_id || user_role !== 'ADMIN') {
        try {await queryfn(query, fields);}
        catch (err) {return next(err);} break;
      }
    // Developer can post to guests
    case 'Developer':
      if (id === user_id || user_role === 'Guest') {
        try {await queryfn(query, fields);}
        catch (err) {return next(err);} break;
      }
    // Guests can only post to own account
    case 'Guest':
      if (id === user_id) {
        try {await queryfn(query, fields);}
        catch (err) {return next(err);} break;
      }
    default:
      res.status(403).send('Unauthorized access, permission denied');
  }
  res.status(201).send('Issue created successfully');
}

exports.issue_put = async (req, res, next) => { 

  // Get id and role of user with userId
  let data;
  try {data = await queryfn('SELECT id, asignee FROM "user" WHERE id = $1', [req.params.userId]);}
  catch (err) {return next(err);}

  // Data of user with userId
  if (!data?.length) {
    return res.status(400).send('User does not exist');
  }

  // Get issue with issueId
  let issue_data;
  try {issue_data = await queryfn('SELECT * FROM issue WHERE issue_id = $1', [req.params.issueId]);}
  catch (err) {return next(err);}

  // Data of issue with issueId
  if (!issue_data?.length) {
    return res.status(400).send('Issue does not exist');
  }
  
  const user = data[0];
  const user_id = user.id;
  const user_role = user.asignee;

  // Id of signed JWT user token
  const id = req.user.id;
  const role = req.user.asignee;

  // Query
  const r = req.body;
  const fields = [r.problem_title, r.problem, user_id, r.task_type, r.status, r.category, r.version, r.priority, 
    r.due_date, req.user.username, req.params.issueId];
  
  // If input is null, don't update the value
  const query = `UPDATE issue SET 
    problem_title = COALESCE(NULLIF($1, ''), problem_title),
    problem = COALESCE(NULLIF($2, ''), problem),
    id = COALESCE(NULLIF($3, '')::NUMERIC, id),
    task_type = COALESCE(NULLIF($4, '')::TASK_TYPE, task_type),
    status = COALESCE(NULLIF($5, '')::STATUS, status),
    category = COALESCE(NULLIF($6, '')::CATEGORY, category),
    version = COALESCE(NULLIF($7, '')::NUMERIC, version), 
    priority = COALESCE(NULLIF($8, '')::PRIORITY, priority),
    due_date = COALESCE(NULLIF($9, '')::TIMESTAMPTZ, due_date),
    registered_by = COALESCE(NULLIF($10, ''), registered_by)
    WHERE issue_id = $11`;

  // Owners can update their own account
  switch (role) {
    // ADMIN can update everyone except other ADMIN
    case 'ADMIN':
      if (id === user_id || user_role !== 'ADMIN') {
        try {await queryfn(query, fields);}
        catch (err) {return next(err);} break;
      }
    // Developer can update guests
    case 'Developer':
      if (id === user_id || user_role === 'Guest') {
        try {await queryfn(query, fields);}
        catch (err) {return next(err);} break;
      }
    // Guests only update own account
    case 'Guest':
      if (id === user_id) {
        try {await queryfn(query, fields);}
        catch (err) {return next(err);} break;
      }
    default:
      return res.status(403).send('Unauthorized access, permission denied');
  }
  res.status(200).json('Issue updated successfully');
}

exports.issue_delete = async (req, res, next) => { 
  // Get id and role of user with userId
  let data;
  try {data = await queryfn('SELECT id, asignee FROM "user" WHERE id = $1', [req.params.userId])}
  catch (err) {return next(err);}

  // Data of user with userId
  if (!data?.length) {
    return res.status(400).send('User does not exist');
  }

  // Get issue with issueId
  let issue_data;
  try {issue_data = await queryfn('SELECT * FROM issue WHERE issue_id = $1', [req.params.issueId]);}
  catch (err) {return next(err);}

  // Data of issue with issueId
  if (!issue_data?.length) {
    return res.status(400).send('Issue does not exist');
  }
  
  const user = data[0];
  const user_id = user.id;
  const user_role = user.asignee;

  // Id of signed JWT user token
  const id = req.user.id;
  const role = req.user.asignee;

  // Query
  const query = 'DELETE FROM issue WHERE issue_id = $1';
  const fields = [req.params.issueId];

  // All owners can delete their own account
  switch (role) {
    // ADMIN can delete everyone except other ADMIN
    case 'ADMIN':
      if (id === user_id || user_role !== 'ADMIN') {
        try {await queryfn(query, fields)}
        catch (err) {return next(err);} break;
      }
    // Developer can delete guests
    case 'Developer':
      if (id === user_id || user_role === 'Guest') {
        try {await queryfn(query, fields)}
        catch (err) {return next(err);} break;
      }
    // Guests can only delete own issue
    case 'Guest':
      if (id === user_id) {
        try {await queryfn(query, fields);}
        catch (err) {return next(err);} break;
      }
    default:
      return res.status(403).send('Unauthorized access, permission denied');
  }
  res.status(200).json('Issue was successfully deleted');
}