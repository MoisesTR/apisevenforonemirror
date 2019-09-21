import { body, sanitize } from '../../utils/defaultImports';

export const createPaypalTransaction = [body('finalPrice', 'El monto a invertir es requerido!').isInt(), sanitize('finalPrice').toInt()];
export const createPayout = [
    body('amountMoneyToPay', 'El monto a pagar es requerido!').isInt()
    , body('paypalEmail', 'El correo de paypal es requerido!').isString()
    , sanitize('amountMoneyToPay').toInt()
];
