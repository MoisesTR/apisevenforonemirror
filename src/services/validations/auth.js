const {param, body, query, sanitize} = require('../../utils/defaultImports');
const { isValidDate, isObjectId } = require('../../utils/genericsValidations');
const commonPasswordAndConfirmation = [
    body('password', 'Must be a String, min length 5 max length 25').isLength({min: 5, max: 25}),
    body('passwordConfirm').custom((value, { req }) => {
        if (value !== req.body.password) {
            throw new Error('Password confirmation does not match password');
        }
        return value;
    })
];

exports.signUp = [
    body('firstName', 'Must be a String, min length 3 max length 150').isLength({min: 3, max: 150}),
    body('lastName', 'Must be a String, min length 3 max length 150').isLength({min: 3, max: 150}),
    body('userName','Must be a String, min length 3 max length 40').isLength({min: 4, max: 40}),
    body('email', 'Must be a valid Email').isEmail(),
    body('password', 'Must be a String, min length 5 max length 25').isLength({min: 5, max: 25}),
    // body('phones', 'Must be a Array of Strings').isArray().optional({ nullable: true }),
    ...commonPasswordAndConfirmation,
    body('phones.*').isLength({min: 7, max: 25}).optional({ nullable: true }),
    body('role').exists(),
    body('birthDate', 'Must be a Valid Date').custom(isValidDate).optional({ nullable: true }),
    body('gender').isString().optional({ nullable: true }),
    sanitize('birthDate').toDate()
];

exports.updateUser =[
    param('userId').custom(isObjectId),
    body('firstName', 'Must be a String, min length 3 max length 150').isLength({min: 3, max: 150}),
    body('lastName', 'Must be a String, min length 3 max length 150').isLength({min: 3, max: 150}),
    body('phones', 'Must be a Array of Strings').isArray().optional({ nullable: true }),
    body('phones.*').isLength({min: 7, max: 25}).optional({ nullable: true }),
    body('birthDate', 'Must be a Valid Date').custom(isValidDate).optional({ nullable: true }),
    body('gender').isString().optional({ nullable: true }),
];

exports.signIn = [
    body('userName').isLength({min: 4, max: 40}),
    body('password').isLength({min: 5, max: 25})
];

exports.signInGoogle = [
    body('role').exists(),
    body('tokenGoogle')
];

exports.verifyUser =  [
    query('token').isLength({min: 7}),
    query('userName').isLength({min: 4, max: 40})
];

exports.refreshToken = [
    body('refreshToken').isLength({min: 15}),
    body('userName').isLength({min: 4, max: 40})
];

exports.changeStateUser = [
    param('userId').custom(isObjectId),
    query('enabled').isBoolean(),
    sanitize('enabled').toBoolean()
];
exports.changePassword = [
    param('userId').custom(isObjectId),
    ...commonPasswordAndConfirmation
];

exports.getUsers = [

];

exports.getUser = [

];

exports.createRole = [
  body('name', 'Name are required!').isLength({min: 3, max: 50}),
  body('description', 'Description are required!').isLength({min: 3, max: 200})
];
