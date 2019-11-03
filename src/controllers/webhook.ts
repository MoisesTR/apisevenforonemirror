import Express from 'express';
import catchAsync from '../utils/catchAsync';

export const webhook = catchAsync(async (req: Express.Request, res: Express.Response, next: Express.NextFunction) => {
    console.log(req.body);
    const ev = req.body;
    const idWebhook = ev.id;

    switch (ev.event_type) {
        case 'PAYMENT.CAPTURE.COMPLETED':
            const orderId = ev.resource.id;
            // Handle payment completed
            break;
        case 'PAYMENT.CAPTURE.PENDING':
            break;
        case 'PAYMENT.CAPTURE.DENIED':
            // Handle payment denied
            break;
        // Handle other webhooks
        default:
            console.log(`El evento ${ev.event_type} no esta considerado`);
            break;
    }
    res.status(200).json({message: 'Todo Marcha Bien'});
});
