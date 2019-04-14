const {param, body, query, sanitize} = require('../../utils/defaultImports');
const { isValidDate, isObjectId } = require('../../utils/genericsValidations');

exports.addMemberToGroup = [
    body('userId').custom(isObjectId),
    body('userName')
];

exports.removeMemberFromGroup = [

];