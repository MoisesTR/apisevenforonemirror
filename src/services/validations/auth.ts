import {body, param, query, sanitize} from '../../utils/defaultImports';
import {isObjectId, isValidDate} from '../../utils/genericsValidations';
import {oneOf} from 'express-validator/check';

const commonPasswordAndConfirmation = [
    body('password', 'La contraseña debe contener un minimo de 5 y un máximo de 25 caracteres!').isLength({min: 5, max: 25}),
    body('passwordConfirm').custom((value, {req}) => {
        if (value !== req.body.password) {
            throw new Error('Las contraseñas no coinciden!');
        }
        return value;
    }),
];
export const recoverAccount = [
    oneOf([
        body('userName', 'El nombre de usuario debe contener un minimo de 3 y maximo de 40 caracteres!').isLength({min: 4, max: 40}),
        body('email', 'Debe ingresar un correo valido!').isEmail(),
    ]),
];
export const getEmail = [
    body('userName', 'El nombre de usuario debe contener un minimo de 3 y maximo de 40 caracteres').isLength({min: 4, max: 40}),
];
const commonUserVal = [
    ...commonPasswordAndConfirmation,
    body('firstName', getMessageMinMaxChar('Los nombres deben', 3, 150)).isLength({
        min: 3,
        max: 150,
    }),
    body('lastName', getMessageMinMaxChar('Los apellidos deben', 3, 150)).isLength({
        min: 3,
        max: 150,
    }),
    body('userName', getMessageMinMaxChar('El nombre de usuario', 3, 150)).isLength({
        min: 4,
        max: 40,
    }),
    body('email', 'Debe ser un correo válido!').isEmail(),
    body('roleId').optional({nullable: true}).custom(isObjectId),
];

export const createAdmin = commonUserVal;

export const signUp = [
    // body('password', 'Must be a String, min lengtrouteh 5 max length 25').isLength({min: 5, max: 25}),
    // body('phones', 'Must be a Array of Strings').isArray().optional({ nullable: true }),
    body('phones.*')
        .isLength({min: 7, max: 25})
        .optional({nullable: true}),
    body('birthDate', 'Debe ser una fecha válida!')
        .custom(isValidDate)
        .optional({nullable: true}),
    body('gender', 'El genero debe ser femenino o masculino!')
        .isIn(['M', 'F'])
        .optional({nullable: true}),
    sanitize('birthDate').toDate(),
    ...commonUserVal,
];

export const updateUser = [
    param('userId').custom(isObjectId),
    body('firstName', getMessageMinMaxChar('Los nombres deben', 3, 150)).isLength({
        min: 3,
        max: 150,
    }).optional({nullable: true}),
    body('lastName', getMessageMinMaxChar('Los apellidos deben', 3, 150)).isLength({
        min: 3,
        max: 150,
    }).optional({nullable: true}),
    body('phones', 'Debe ser un array de strings!')
        .isArray()
        .optional({nullable: true}),
    body('phones.*')
        .isLength({min: 7, max: 25})
        .optional({nullable: true}),
    body('birthDate', 'No es una fecha valida!')
        .custom(isValidDate)
        .optional({nullable: true}),
    body('gender')
        .isIn(['M', 'F'])
        .optional({nullable: true}),
];

export const signIn = [body('userName').isLength({min: 4, max: 40}), body('password').isLength({min: 5, max: 25})];

export const signInGoogle = [body('roleId').optional({nullable: true}), body('accessToken')];

export const signInFacebook = [body('roleId').optional({nullable: true}), body('accessToken')];

export const verifyUser = [query('token').isLength({min: 7}), query('userName').isLength({min: 4, max: 40})];

export const refreshToken = [body('refreshToken').isLength({min: 15}), body('userName').exists()];

export const changeStateUser = [param('userId').custom(isObjectId), query('enabled').isBoolean(), sanitize('enabled').toBoolean()];
export const changePassword = [param('userId').custom(isObjectId), ...commonPasswordAndConfirmation];
export const verifyChangePassword = [param('userId').custom(isObjectId), body('password')];

export const getUsers = [];

export const getUser = [];

export const createRole = [
    body('name', 'El nombre es requerido!').isLength({min: 3, max: 50}),
    body('description', 'La descripción es requerida!').isLength({
        min: 3,
        max: 200,
    }),
];

export const uploadImage = [param('id').custom(isObjectId)];

function getMessageMinMaxChar(obj: string, min: number, max: number) {
    return obj + ' contener un minimo de ' + min + ' y máximo de ' + max + ' caracteres!';
}
