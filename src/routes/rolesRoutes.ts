import Express from 'express';
import * as validations from '../services/validations/auth';
import {validsParams} from '../utils/genericsValidations';
import * as roleController from '../controllers/roles';
import {ensureAuth} from '../services/jwt';

const router = Express.Router();

router.use(ensureAuth);

router.route('/roles$')
    .post(validations.createRole, validsParams, roleController.createRole)
    .get(roleController.getRoles);

router.route('/roles/:roleId')
    .get(roleController.getRole);

export default router;