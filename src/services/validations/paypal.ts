import {body, sanitize} from '../../utils/defaultImports';

export const createPaypalTransaction = [
    body('finalPrice', 'El monto a invertir es requerido!').isInt(),
    body('groupId', 'El grupo es requerido!').isString(),
    sanitize('finalPrice').toInt(),
];

export const authorizePaypalTransaction = [body('orderID', 'El monto a invertir es requerido!').isString()];

export const captureTransaction = [body('orderID', 'El id de la orden es requerido!').isString()];

export const createPayout = [
    body('amountMoneyToPay', 'El monto a pagar es requerido!').isInt(),
    body('paypalEmail', 'El correo de paypal es requerido!').isString(),
    sanitize('amountMoneyToPay').toInt(),
];
