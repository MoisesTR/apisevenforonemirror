const {param, body, query, sanitize} = require('../../utils/defaultImports');
const { isValidDate } = require('../../utils/genericsValidations');

exports.signUp = [
    body('firstName', 'Must be a String, min length 3 max length 150').isLength({min: 3, max: 150}),
    body('lastName', 'Must be a String, min length 3 max length 150').isLength({min: 3, max: 150}),
    body('userName','Must be a String, min length 3 max length 40').isLength({min: 4, max: 40}),
    body('email', 'Must be a valid Email').isEmail(),
    body('password', 'Must be a String, min length 5 max length 25').isLength({min: 5, max: 25}),
    body('phones', 'Must be a Array of Strings').isArray(),
    body('phones.*').isLength({min: 7, max: 25}),
    body('role').isString(),
    body('birthDate', 'Must be a Valid Date').custom(isValidDate),
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

exports.getUsers = [

];

exports.getUser = [

];