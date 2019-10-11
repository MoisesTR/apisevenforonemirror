import Express from 'express';
import * as validations from '../services/validations/auth';
import {validsParams} from '../utils/genericsValidations';
import * as roleController from '../controllers/roles';
import {ensureAuth} from '../services/jwt';

//All these routes run below the path /api/roles
const router = Express.Router();

router.use(ensureAuth);

router.route('/$')
    .post(validations.createRole, validsParams, roleController.createRole)
    .get(roleController.getRoles);

router.route('/:id')
    .get(roleController.getRole);

export default router;