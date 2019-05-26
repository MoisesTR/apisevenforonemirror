const {param, body, query, sanitize} = require('../../utils/defaultImports');
const { isValidDate, isObjectId } = require('../../utils/genericsValidations');

exports.createPaypalTransaction = [
    body('finalPrice', 'El monto a invertir es requerido!').isInt(),
    sanitize('finalPrice').toInt()
];

