const pool = require('../config/psql_config');

const queryfn = async(query, fields) => {
    let data = await pool.query(query, fields).catch(err => {throw(err);})
    return data.rows;
}

exports.comment_getAll = async (req, res, next) => {
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

  // Get id of issue with issueId
  let issue_data; 
  try {issue_data = await queryfn('SELECT issue_id FROM issue WHERE issue_id = $1', [req.params.issueId]);}
  catch (err) {next(err);return;}

  // Data of issue with issueId
  if (!issue_data?.length) {
    return res.status(400).send('Issue does not exist');
  } 
  const issue = issue_data[0];
  const issue_id = issue.issue_id;

  // Id of signed JWT user token
  const id = req.user.id;
  const role = req.user.asignee;

  const query = 'SELECT * FROM comment WHERE issue_id = $1 AND id = $2';
  const fields = [issue_id, user_id];

  let comments_data;
  switch (role) {
    // 'ADMIN' can access all profiles except other ADMINS
    case 'ADMIN':
      if (id === user_id || user_role !== 'ADMIN') {
        try {comments_data = await queryfn(query, fields);}
        catch (err) {return next(err);} break;
      }
    // 'Developer' can access all guests
    case 'Developer':
      if (id === user_id || user_role === 'Guest') {
        try {comments_data = await queryfn(query, fields);}
        catch (err) {return next(err);} break;
      }
    case 'Guest':
      if (id === user_id) {
        try {comments_data = await queryfn(query, fields);}
        catch (err) {return next(err);} break;
      }
    default:
      return res.status(403).send('Unauthorized access, permission denied');
  }

  // Convert to object
  let comments = Object.assign({}, [...comments_data]);

  res.status(200).json(comments);
}

exports.comment_get = async (req, res, next) => {

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

   // Get id of issue with issueId
   let issue_data; 
   try {issue_data = await queryfn('SELECT issue_id FROM issue WHERE issue_id = $1', [req.params.issueId]);}
   catch (err) {next(err);return;}
 
   // Data of issue with issueId
   if (!issue_data?.length) {
     return res.status(400).send('Issue does not exist');
   } 
   const issue = issue_data[0];
   const issue_id = issue.issue_id;

  // Id of signed JWT user token
  const id = req.user.id;
  const role = req.user.asignee;

  // Query
  const query = 'SELECT * FROM comment WHERE comment_id = $1 AND issue_id = $2 AND id = $3';
  const fields = [req.params.commentId, issue_id, user_id];

  let comment_data;
  switch (role) {
    // If 'ADMIN', send data only if owner or not ADMIN
    case 'ADMIN':
      if (id === user_id || user_role !== 'ADMIN') {
        try {comment_data = await queryfn(query, fields);}
        catch (err) {return next(err);} break;
      }
    // If 'Developer', send data only if owner or guest
    case 'Developer':
      if (id === user_id || user_role === 'Guest') {
        try {comment_data = await queryfn(query, fields);}
        catch (err) {return next(err);} break;
      }
    // If 'Guest', send data only if owner
    case 'Guest':
      if (id === user_id) {
        try {comment_data = await queryfn(query, fields);}
        catch (err) {return next(err);} break;
      }
    default:
      return res.status(403).send('Unauthorized access, permission denied');
  }

  if (!comment_data?.length) {
    return res.status(400).send('Comment does not exist');
  }

  res.status(200).json(comment_data[0]);
}

exports.comment_post = async (req, res, next) => {

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

  // Get id of issue with issueId
  let issue_data; 
  try {issue_data = await queryfn('SELECT issue_id FROM issue WHERE issue_id = $1', [req.params.issueId]);}
  catch (err) {next(err);return;}

  // Data of issue with issueId
  if (!issue_data?.length) {
    return res.status(400).send('Issue does not exist');
  }

  const issue = issue_data[0];
  const issue_id = issue.issue_id;

  // Id of signed JWT user token
  const id = req.user.id;
  const role = req.user.asignee;

  // Query
  const r = req.body;
  const fields = [r.comment_title, r.comment, user_id, issue_id, req.user.username];
  const query = `INSERT INTO comment(comment_title, comment, id, issue_id, registered_by, created_at) 
    VALUES ($1, $2, $3, $4, $5, NOW())`;
  
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
  res.status(201).send('Comment created successfully');
}

exports.comment_put = async (req, res, next) => { 

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

  // Get issue with issueId
  let issue_data;
  try {issue_data = await queryfn('SELECT * FROM issue WHERE issue_id = $1', [req.params.issueId]);}
  catch (err) {return next(err);}

  // Data of issue with issueId
  if (!issue_data?.length) {
    return res.status(400).send('Issue does not exist');
  }

  const issue = issue_data[0];
  const issue_id = issue.issue_id;

  // Get issue with commentId
  let comment_data;
  try {comment_data = await queryfn('SELECT * FROM comment WHERE comment_id = $1', [req.params.commentId]);}
  catch (err) {return next(err);}

  // Data of issue with commentId
  if (!comment_data?.length) {
    return res.status(400).send('Comment does not exist');
  }

  // Id of signed JWT user token
  const id = req.user.id;
  const role = req.user.asignee;

  // Query
  const r = req.body;
  const fields = [r.comment_title, r.comment, req.user.username, req.params.commentId, user_id, issue_id];
  
  // If input is null, don't update the value
  const query = `UPDATE comment SET 
    comment_title = COALESCE(NULLIF($1, ''), comment_title),
    comment = COALESCE(NULLIF($2, ''), comment),
    registered_by = COALESCE(NULLIF($3, ''), registered_by)
    WHERE comment_id = $4 AND id = $5 AND issue_id = $6`;

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
  res.status(200).json('Comment updated successfully');
}

exports.comment_delete = async (req, res, next) => { 
  // Get id and role of user with userId
  let data;
  try {data = await queryfn('SELECT id, asignee FROM "user" WHERE id = $1', [req.params.userId])}
  catch (err) {return next(err);}

  // Data of user with userId
  if (!data?.length) {
    return res.status(400).send('User does not exist');
  }

  const user = data[0];
  const user_id = user.id;
  const user_role = user.asignee;

  // Get issue with issueId
  let issue_data;
  try {issue_data = await queryfn('SELECT * FROM issue WHERE issue_id = $1', [req.params.issueId]);}
  catch (err) {return next(err);}

  // Data of issue with issueId
  if (!issue_data?.length) {
    return res.status(400).send('Issue does not exist');
  }

  // Get issue with commentId
  let comment_data;
  try {comment_data = await queryfn('SELECT * FROM comment WHERE comment_id = $1', [req.params.commentId]);}
  catch (err) {return next(err);}

  // Data of issue with commentId
  if (!comment_data?.length) {
    return res.status(400).send('Comment does not exist');
  }

  // Id of signed JWT user token
  const id = req.user.id;
  const role = req.user.asignee;

  // Query
  const query = 'DELETE FROM comment WHERE comment_id = $1 AND issue_id = $2 AND id = $3';
  const fields = [req.params.commentId, req.params.issueId, req.params.userId];

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
  res.status(200).json('Comment was successfully deleted');
}