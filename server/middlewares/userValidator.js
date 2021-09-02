const { body, validationResult } = require('express-validator');

exports.userValidator = [
    body('asignee', 'Asignee must be "ADMIN", "Developer", or "Guest"').isIn(['ADMIN', 'Developer', 'Guest']),
    body('userName', 'Username must have minimum length 1 and max length 255 char').trim().isLength({min: 1, max: 255}).escape(),
    body('password', 'Password must have minimum length 1 and max length 100 char').trim().isLength({min: 1, max: 100}).escape(),
    body('firstName', 'First name must have minimum length 1 and max length 30 char').trim().isLength({min: 1, max: 30}).escape(),
    body('lastName', 'Last name must have minimum length 1 and max length 30 char').trim().isLength({min: 1, max: 30}).escape(),
    body('birthDate', 'Birth date must be a birthday').toDate().isISO8601(),
    body('email', 'Email must be an email').isEmail().normalizeEmail(),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({errors: errors.array()})
        }
        next();
    }
]