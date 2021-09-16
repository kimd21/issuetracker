const { body, validationResult } = require('express-validator');

exports.userValidator = [
    // Body sanitization
    body('asignee','Asignee must be "ADMIN", "Developer", or "Guest"').isIn(['ADMIN', 'Developer', 'Guest']).optional({nullable: true, checkFalsy: true}),
    body('userName', 'Username must have max length 255 char').trim().isLength({min: 1, max: 255}).escape().optional({nullable: true, checkFalsy: true}),
    body('password', 'Password must have max length 100 char').trim().isLength({min: 1, max: 100}).escape().optional({nullable: true, checkFalsy: true}),
    body('firstName', 'First name must have max length 30 char').trim().isLength({min: 1, max: 30}).escape().optional({nullable: true, checkFalsy: true}),
    body('lastName', 'Last name must have max length 30 char').trim().isLength({min: 1, max: 30}).escape().optional({nullable: true, checkFalsy: true}),
    body('birthDate', 'Birth date must be a birthday').toDate().isISO8601().optional({nullable: true, checkFalsy: true}),
    body('email', 'Email must be an email').isEmail().normalizeEmail().optional({nullable: true, checkFalsy: true}),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({errors: errors.array()})
        }
        next();
    }
];