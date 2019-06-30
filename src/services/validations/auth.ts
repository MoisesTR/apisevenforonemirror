import {body, param, query, sanitize} from '../../utils/defaultImports';
import {isObjectId, isValidDate} from '../../utils/genericsValidations';
import {oneOf} from 'express-validator/check';


const commonPasswordAndConfirmation = [
    body('password', 'Must be a String, min length 5 max length 25').isLength({min: 5, max: 25}),
    body('passwordConfirm').custom((value, {req}) => {
        if (value !== req.body.password) {
            throw new Error('Password confirmation does not match password');
        }
        return value;
    })
];
export const recoverAccount = [
    oneOf([
        body('userName', 'Must be a String, min length 3 max length 40').isLength({min: 4, max: 40}),
        body('email', 'Must be a valid Email').isEmail()
    ])
];

export const signUp = [
    body('firstName', 'Must be a String, min length 3 max length 150').isLength({min: 3, max: 150}),
    body('lastName', 'Must be a String, min length 3 max length 150').isLength({min: 3, max: 150}),
    body('userName', 'Must be a String, min length 3 max length 40').isLength({min: 4, max: 40}),
    body('email', 'Must be a valid Email').isEmail(),
    body('password', 'Must be a String, min length 5 max length 25').isLength({min: 5, max: 25}),
    // body('phones', 'Must be a Array of Strings').isArray().optional({ nullable: true }),
    ...commonPasswordAndConfirmation,
    body('phones.*').isLength({min: 7, max: 25}).optional({nullable: true}),
    body('roleId').custom(isObjectId),
    body('birthDate', 'Must be a Valid Date').custom(isValidDate).optional({nullable: true}),
    body('gender', 'Gender must be M or F.').isIn(['M', 'F']).optional({nullable: true}),
    sanitize('birthDate').toDate()
];

export const updateUser = [
    param('userId').custom(isObjectId),
    body('firstName', 'Must be a String, min length 3 max length 150').isLength({min: 3, max: 150}),
    body('lastName', 'Must be a String, min length 3 max length 150').isLength({min: 3, max: 150}),
    body('phones', 'Must be a Array of Strings').isArray().optional({nullable: true}),
    body('phones.*').isLength({min: 7, max: 25}).optional({nullable: true}),
    body('birthDate', 'Must be a Valid Date').custom(isValidDate).optional({nullable: true}),
    body('gender').isString().optional({nullable: true}),
];

export const signIn = [
    body('userName').isLength({min: 4, max: 40}),
    body('password').isLength({min: 5, max: 25})
];

export const signInGoogle = [
    body('roleId').exists(),
    body('accessToken')
];

export const signInFacebook = [
    body('roleId').exists(),
    body('accessToken')
];

export const verifyUser = [
    query('token').isLength({min: 7}),
    query('userName').isLength({min: 4, max: 40})
];

export const refreshToken = [
    body('refreshToken').isLength({min: 15}),
    body('userName').isLength({min: 4, max: 40})
];

export const changeStateUser = [
    param('userId').custom(isObjectId),
    query('enabled').isBoolean(),
    sanitize('enabled').toBoolean()
];
export const changePassword = [
    param('userId').custom(isObjectId),
    ...commonPasswordAndConfirmation
];

export const getUsers = [];

export const getUser = [];

export const createRole = [
    body('name', 'Name are required!').isLength({min: 3, max: 50}),
    body('description', 'Description are required!').isLength({min: 3, max: 200})
];
