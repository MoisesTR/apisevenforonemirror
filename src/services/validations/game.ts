import {body, param, query, sanitize} from '../../utils/defaultImports';
import {isObjectId} from '../../utils/genericsValidations';

export const getGroup = [param('groupId').custom(isObjectId)];

// body('userId').custom(isObjectId),
export const createGroup = [
    body('initialInvertion').isInt(),
    body('uniqueChange').isBoolean(),
    sanitize('initialInvertion').toInt(),
];

export const addMemberToGroup = [
    param('groupId').custom(isObjectId),
    body('payReference').isLength({
        min: 5,
        max: 150,
    }),
];
export const userIdParam = [
    param('userId')
        .isLength({min: 10})
        .custom(isObjectId),
];

export const removeMemberFromGroup = [
    param('groupId').custom(isObjectId),
    param('userId')
        .isLength({min: 10})
        .custom(isObjectId),
];
export const getLastWinners = [
    param('quantity').isInt(),
    param('groupId')
        .optional({nullable: true})
        .custom(isObjectId),
];

export const getTopWinners = [
    ...getLastWinners,
    query('times')
        .optional({nullable: true})
        .isBoolean(),
];
