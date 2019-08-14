import {body, sanitize} from '../../utils/defaultImports';

export const createPaypalTransaction = [body('finalPrice', 'El monto a invertir es requerido!').isInt(), sanitize('finalPrice').toInt()];
