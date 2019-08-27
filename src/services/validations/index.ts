import {param, query} from 'express-validator/check';
import {isObjectId} from '../../utils/genericsValidations';
import {sanitize} from 'express-validator/filter';

export const changeActiveStateMw = (name: string) => [param(name).custom(isObjectId), query('enabled').isBoolean(), sanitize('enabled').toBoolean()];