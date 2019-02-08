const {param, body, query, sanitize} = require('../../utils/defaultImports');
const { isValidDate } = require('../../utils/genericsValidations');

exports.signUp = [
    body('firstName').isLength({min: 3, max: 150}),
    body('lastName').isLength({min: 3, max: 150}),
    body('userName').isLength({min: 4, max: 40}),
    body('email').isEmail(),
    body('password').isLength({min: 5, max: 25}),
    body('phones').isArray(),
    body('phones.*').isLength({min: 7, max: 25}),
    body('role').isString(),
    body('birthDate').custom(isValidDate),
    sanitize('birthDate').toDate()
];

exports.signIn = [
    body('userName').isLength({min: 4, max: 40}),
    body('password').isLength({min: 5, max: 25}),
];

exports.verifyUser =  [
    param('token').isLength({min: 7}),
    query('userName').isLength({min: 4, max: 40})
];
