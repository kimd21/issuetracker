const { body, validationResult } = require('express-validator');

exports.commentValidator = [
    // Body sanitization
    body('comment_title', 'Comment title must have minimum length 1 and max length 255 char').trim().isLength({min: 1, max: 255}).escape().optional({nullable: true, checkFalsy: true}),
    body('comment', 'Comment must have minimum length 1 and max length 255 char').trim().isLength({min: 1, max: 255}).escape().optional({nullable: true, checkFalsy: true}),
    // Created_at is auto assigned
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({errors: errors.array()})
        }
        next();
    }
];