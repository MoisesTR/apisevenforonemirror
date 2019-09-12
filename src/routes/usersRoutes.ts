import Express from 'express';
import * as validations from '../services/validations/auth';
import {validsParams} from '../utils/genericsValidations';
import {ensureAuth} from '../services/jwt';
import * as authController from '../controllers/auth';

const router = Express.Router();


router.use(ensureAuth);
router.route('/')
    .get(validsParams, authController.getUsers);

router.put('/pwd/:userId', validations.changePassword, validsParams, authController.changePassword);

router.route('/:userId')
    .put(validations.updateUser, validsParams, authController.updateUser)
    .delete(validations.changeStateUser, validsParams, authController.changeStateUser)
    .get(validations.getUser, validsParams, authController.getUser);


router.post('/verifyPwd/:userId', validations.verifyChangePassword, validsParams, authController.verifyChangePassword);


export default router;