const pool = require('../config/psql_config');
const { body, validationResult } = require('express-validator');
const dotenv = require('dotenv').config();

exports.issue_getAll = async (req, res, next) => {
  let issues_data;
  switch (req.issue.asignee) {
    // 'Guest' cannot access this route
    case 'Guest':
      return res.status(403).send('Unauthorized access, permission denied');
    // 'ADMIN' can access all profiles except other ADMINS
    case 'ADMIN':
      issues_data = await pool.query('SELECT * FROM "user" WHERE asignee != $1 NATURAL JOIN issue ON "user".id = issue.uid', ['ADMIN']).catch(err => next(err));
      break;
    // 'Developer' can access all guests
    case 'Developer':
      issues_data = await pool.query('SELECT * FROM "user" WHERE asignee = $1 NATURAL JOIN issue ON "user".id = issue.uid', ['Guest']).catch(err => next(err));
      break;
    default:
      return res.status(403).send('Unauthorized access, permission denied');
  }

  // Get personal data
  let personal_data = await pool.query('SELECT * FROM "user" WHERE id = $1 NATURAL JOIN issue ON "user".id = issue.uid', [req.user.id]).catch(err => next(err));
  
  // Merge personal data with accessed data into one object
  merged_data = Object.assign({}, [...issues_data.rows, ...personal_data.rows]);
  return res.status(200).json(merged_data);
}

// exports.issue_get = async (req, res, next) => {

//   // Get id and role of issue with userId
//   let data = await pool.query('SELECT id, asignee FROM issue WHERE id = $1', [req.params.issueId]).catch(err => next(err));

//   // Data of issue with userId
//   const issue = data.rows[0];
//   const issue_id = user.id;

//   // Id of signed JWT issue token
//   const id = req.issue.id;
//   const role = req.issue.asignee;

//   // Error message
//   const err_msg = 'Unauthorized access, permission denied';

//   // Query
//   // TODO: add inner join on issue and comment tables
//   const query = 'SELECT * FROM issue WHERE id = $1';

//   let issue_data;
//   switch (issue.asignee) {
//     // If issue is 'ADMIN', send user data only if owner
//     case 'ADMIN':
//       if (issue_id === id) {
//         issue_data = await pool.query(query, [user_id]);
//         res.status(200).json(issue_data.rows[0]);
//         break;
//       }
//       return res.status(403).send(err_msg);
//     // If issue is 'Developer', send user data only if owner or ADMIN
//     case 'Developer':
//       if (issue_id === id || role === 'ADMIN') {
//         issue_data = await pool.query(query, [user_id]);
//         res.status(200).json(issue_data.rows[0]);
//         break;
//       }
//       return res.status(403).send(err_msg);
//     // If issue is 'Guest', send user data only if owner, developer, or ADMIN
//     case 'Guest':
//       if (issue_id === id || role === 'ADMIN' || role === 'Developer') {
//         issue_data = await pool.query(query, [user_id]);
//         res.status(200).json(issue_data.rows[0]);
//         break;
//       }
//       return res.status(403).send(err_msg);
//     default:
//       return res.status(403).send(err_msg);
//   }
// }

exports.issue_post = async (req, res, next) => {
  // Body sanitization
  body('problem', 'Problem must not be empty').trim().isLength({min: 1, max: 1000}).escape();
  body('task_type', 'Task type must not be empty').isIn(['task', 'request', 'bug']);
  body('status', 'Status must not be empty').isIn(['open', 'closed', 'in progress', 'resolved']);
  body('category', 'Category must not be empty').isIn(['back end', 'front end']);
  // Version number is auto assigned to 1.0
  body('priority', 'Priority must not be empty').isIn(['low', 'medium', 'high']);
  // Created_at is auto assigned to 
  body('due_date', 'Due date must not be empty').isISO8601();
  body('registered_by', 'Registered by must not be empty').trim().isLength({min: 1, max: 100}).escape();
  const errors = validationResult(req.body);
  if (!errors.isEmpty()) {
    return next(err);
  }

  // Get id and role of issue with userId
  let data = await pool.query('SELECT id, asignee FROM "user" WHERE id = $1', [req.params.userId]).catch(err => next(err));

  // Data of issue with userId
  const user = data.rows[0];
  const user_id = user.id;
  const user_role = user.asignee;

  // Id of signed JWT issue token
  const id = req.user.id;
  const role = req.user.asignee;

  // Error message
  const err_msg = 'Unauthorized access, permission denied';

  // Query
  const r = req.body;
  const fields = [r.problem, user_id, r.task_type, r.status, r.category, 1.0, r.priority, r.due_date, r.registered_by];
  const query = `INSERT INTO issue(problem, uid, task_type, status, category, version, priority, due_date, registered_by, created_at) 
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())`;
  
  // All owners can post to their own account
  switch (role) {
    // ADMIN can post to everyone except other ADMINs
    case 'ADMIN':
      if (id === user_id || user_role !== 'ADMIN') {
        await pool.query(query, fields).catch(err => next(err));
        break;
      }
      res.status(403).send(err_msg);
    // Developer can post to guests
    case 'Developer':
      if (id === user_id || user_role === 'Guest') {
        await pool.query(query, fields).catch(err => next(err));
        break;
      }
      res.status(403).send(err_msg);
    case 'Guest':
      if (id === user_id) {
        await pool.query(query, fields).catch(err => next(err));
        break;
      }
      res.status(403).send(err_msg);
    default:
      res.status(403).send(err_msg);
  }
}

// exports.issue_put = async (req, res, next) => { 
//   // Body sanitization
//   body('asignee', 'Asignee must not be empty').isIn(['ADMIN', 'Developer', 'Guest']);
//   body('issueName', 'Username must not be empty').trim().isLength({min: 1, max: 255}).escape();
//   body('password', 'Password must not be empty').trim().isLength({min: 1, max: 100}).escape();
//   body('firstName', 'First name must not be empty').trim().isLength({min: 1, max: 30}).escape();
//   body('lastName', 'Last name must not be empty').trim().isLength({min: 1, max: 30}).escape();
//   body('birthDate', 'Birth date must not be empty').isISO8601().toDate();
//   body('email', 'Email must not be empty').isEmail().normalizeEmail();
//   const errors = validationResult(req.body); 
//   if (!errors.isEmpty()) {
//     return next(err);
//   }

//   // Get id and role of issue with userId
//   let data = await pool.query('SELECT id, asignee FROM issue WHERE id = $1', [req.params.issueId]).catch(err => next(err));

//   // Data of issue with userId
//   const issue = data.rows[0];
//   const issue_id = user.id;
//   const issue_role = user.asignee;

//   // Id of signed JWT issue token
//   const id = req.issue.id;
//   const role = req.issue.asignee;

//   // Error message
//   const err_msg = 'Unauthorized access, permission denied';

//   // Query
//   const r = req.body;
//   const fields = [r.asignee, r.issueName, r.password, r.firstName, r.lastName, r.birthDate, r.email, user_id];
//   // coalesce: if input is null, just use existing parameter
//   const query = `UPDATE issue SET 
//     asignee = COALESCE($1, asignee),
//     issuename = COALESCE($2, username),
//     password = COALESCE($3, password),
//     first_name = COALESCE($4, first_name),
//     last_name = COALESCE($5, last_name),
//     birth_date = COALESCE($6, birth_date), 
//     email = COALESCE($7, email) 
//     WHERE id = $8`;

//   // Owners can update their own account
//   switch (role) {
//     // ADMIN can assign roles to everyone except other ADMIN
//     case 'ADMIN':
//       if (id === issue_id || user_role !== 'ADMIN') {
//         await pool.query(query, fields);
//         break;
//       }
//       return res.status(403).send(err_msg);
//     // Developer can assign roles to guests
//     case 'Developer':
//       if (id === issue_id || user_role === 'Guest') {
//         await pool.query(query, fields);
//         break;
//       }
//       return res.status(403).send(err_msg);
//     // Guests cannot change roles
//     case 'Guest':
//       if (id === issue_id) {
//         await pool.query(query, ['Guest', fields.slice(1)]);
//         break;
//       }
//       return res.status(403).send(err_msg);
//     default:
//       return res.status(403).send(err_msg);
//   }
// }

// exports.issue_delete = async (req, res, next) => { 
//   // Get id and role of issue with userId
//   let data = await pool.query('SELECT id, asignee FROM issue WHERE id = $1', [req.params.issueId]).catch(err => next(err));

//   // Data of issue with userId
//   const issue = data.rows[0];
//   const issue_id = user.id;
//   const issue_role = user.asignee;

//   // Id of signed JWT issue token
//   const id = req.issue.id;
//   const role = req.issue.asignee;

//   // Error message
//   const err_msg = 'Unauthorized access, permission denied';

//   // Query
//   const query = 'DELETE FROM issue WHERE id = $1';

//   // All owners can delete their own account
//   switch (role) {
//     // ADMIN can delete everyone except other ADMIN
//     case 'ADMIN':
//       if (id === issue_id || user_role !== 'ADMIN') {
//         await pool.query(query, issue_id).catch(err => next(err));
//         break;
//       }
//       return res.status(403).send(err_msg);
//     // Developer can delete guests
//     case 'Developer':
//       if (id === issue_id || user_role === 'Guest') {
//         await pool.query(query, issue_id).catch(err => next(err));
//         break;
//       }
//       return res.status(403).send(err_msg);
//     // Guests cannot access this route
//     default:
//       return res.status(403).send(err_msg);
//   }
// }