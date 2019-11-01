import express from 'express';
import {ensureAuth} from '../services/jwt';
import * as creditGameController from '../controllers/credit-game';

const router = express.Router();
router.use(ensureAuth);
router.route('/$').get(creditGameController.getAll);

router.route('/:id').get(creditGameController.getOne);

export default router;
