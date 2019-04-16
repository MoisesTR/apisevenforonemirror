const {param, body, query, sanitize} = require('../../utils/defaultImports');
const { isValidDate, isObjectId } = require('../../utils/genericsValidations');

exports.getGroup = [
    param('groupId').custom(isObjectId)
];

    // body('userId').custom(isObjectId),
exports.createGroup = [
    body('initialInvertion').isInt(),
    sanitize('initialInvertion').toInt()
];

exports.addMemberToGroup = [
    param('groupId').custom(isObjectId),
    body('payReference').isLength({min: 5, max: 150})
];


exports.removeMemberFromGroup = [
    param('groupId').custom(isObjectId),
    param('userId').isLength({min: 10}).custom(isObjectId)
];