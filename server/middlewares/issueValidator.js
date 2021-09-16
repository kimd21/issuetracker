const { body, validationResult } = require('express-validator');

exports.issueValidator = [
    // Body sanitization
    body('problem_title', 'Problem title must have minimum length 1 and max length 255 char').trim().isLength({min: 1, max: 255}).escape().optional({nullable: true, checkFalsy: true}),
    body('problem', 'Problem must have minimum length 1 and max length 1000 char').trim().isLength({min: 1, max: 1000}).escape().optional({nullable: true, checkFalsy: true}),
    body('task_type', 'Task type must be "task", "request", or "bug"').isIn(['task', 'request', 'bug']).optional({nullable: true, checkFalsy: true}),
    body('status', 'Status must be "open", "closed", "in progress", or "resolved"').isIn(['open', 'closed', 'in progress', 'resolved']).optional({nullable: true, checkFalsy: true}),
    body('category', 'Category must be "back end" or "front end"').isIn(['back end', 'front end']).optional({nullable: true, checkFalsy: true}),
    body('version', 'Version must be a decimal with precision 2 i.e. 1.0').custom(value =>
        {return (/^\d{1}\.\d{1}$/).test(value);}).optional({nullable: true, checkFalsy: true}),
    body('priority', 'Priority must be "low", "medium", or "high"').isIn(['low', 'medium', 'high']).optional({nullable: true, checkFalsy: true}),
    // Created_at is auto assigned
    body('due_date', 'Due date must be a date').toDate().isISO8601().optional({nullable: true, checkFalsy: true}),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({errors: errors.array()})
        }
        next();
    }
];