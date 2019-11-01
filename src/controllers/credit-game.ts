import catchAsync from '../utils/catchAsync';
import * as factory from './factory';
import CreditGame from '../db/models/CreditGame';
const {getOne: getOneFactory} = factory;

export const getAll = catchAsync(async (req, res, next) => {
    res.send('continua');
});

export const getOne = getOneFactory(CreditGame);
