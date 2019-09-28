import Express from 'express';
import * as validations from '../services/validations/auth';
import {validsParams} from '../utils/genericsValidations';
import {ensureAuth, isAdmin} from '../services/jwt';
import * as usersController from '../controllers/users';

// All these routes run below the path /api/users
const router = Express.Router();

router.get('/email/:userName', validations.getEmail, usersController.getEmailByUserName);

router.use(ensureAuth);
router.route('/me')
    .patch(usersController.updateMe, validations.updateUser, validsParams, usersController.updateUser);

router.route('/')
    .post(isAdmin, usersController.createUser)
    .get(validsParams, usersController.getUsers);

router.route('/:userId')
    .patch(validations.updateUser, validsParams, usersController.updateUser)
    .delete(validations.changeStateUser, validsParams, usersController.changeStateUser)
    .get(validations.getUser, validsParams, usersController.getUser);
router.put('/paypalEmail/:userId', validations.updatePaypalEmail, validsParams, usersController.updatePaypalEmail);

export default router;