import Express from 'express';
import * as validations from '../services/validations/auth';
import {validsParams} from '../utils/genericsValidations';
import {ensureAuth} from '../services/jwt';
import * as authController from '../controllers/auth';

const router = Express.Router();

router.use(ensureAuth);

router.route('/users')
    .get(validations.getUsers, validsParams, authController.getUsers);

router.put('/users/pwd/:userId', ensureAuth, validations.changePassword, validsParams, authController.changePassword);

router.post('/users/verifyPwd/:userId', ensureAuth, validations.verifyChangePassword, validsParams, authController.verifyChangePassword);


router.route('/users/:userId')
    .put(ensureAuth, validations.updateUser, validsParams, authController.updateUser)
    .delete(validations.changeStateUser, validsParams, authController.changeStateUser)
    .get(validations.getUser, validsParams, authController.getUser);

export default router;