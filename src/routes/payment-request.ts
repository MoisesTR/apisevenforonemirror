import express from 'express';
import * as paymentRequestController from '../controllers/payment-request';
import {ensureAuth} from '../services/jwt';

const router = express.Router();

router.use(ensureAuth);
router
    .route('/$')
    .get(paymentRequestController.getAll)
    .post(paymentRequestController.createOne);

router.route('/:id').get(paymentRequestController.getOne);

export default router;
