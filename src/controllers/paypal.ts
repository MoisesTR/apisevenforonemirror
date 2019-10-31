// 1a. Import the SDK package
// @ts-ignore
import paypal from '@paypal/checkout-server-sdk';
// @ts-ignore
import checkoutNodeJssdk from '@paypal/checkout-server-sdk';
import crypto from 'crypto';
import Express from 'express';
import requestPaypal from 'request';
import AppError from '../classes/AppError';
// import checkoutNodeJssdk from '@paypal/checkout-server-sdk';
// 1b. Import the PayPal SDK client that was created in `Set up Server-Side SDK`.
/**
 * PayPal HTTP client dependency
 */
import envVars from '../global/environment';
import {client} from '../paypalClient';
import catchAsync from '../utils/catchAsync';
// NAME ERROR PAYPAL
const INSUFFICIENT_FUNDS = 'INSUFFICIENT_FUNDS';
import logger from '../services/logger';

// 1. Set up your server to make calls to PayPal
// 2. Set up your server to receive a call from the client
export const createPaypalTransaction = catchAsync(
    async (req: Express.Request, res: Express.Response, next: Express.NextFunction) => {
        // 3. Call PayPal to set up a transaction
        const finalPrice = req.body.finalPrice;
        const groupId = req.body.groupId;

        const moneyCode = 'USD';
        const descriptionItem = 'Inversion en grupo de juego 7x1';
        const nameItemBuy = 'Inversion Grupo';

        logger.info('Creando transaccion paypal');

        let order;

        try {
            if (finalPrice <= 0) {
                return next(
                    new AppError('El precio de la compra no puede ser menor o igual a cero!', 400, 'EERPAYPALPRICE'),
                );
            }

            const request = createRequest(moneyCode, finalPrice.toString(), nameItemBuy, descriptionItem);

            order = await client().execute(request);
        } catch (err) {
            // 4. Handle any errors from the call
            logger.error('Error Paypal', err);

            throw err as AppError;
            // let messageError = '';
            // if (err.code === 'EERPAYPALPRICE') {
            //     messageError = err.message;
            // } else {
            //     messageError = 'Ha ocurrido un error con los datos de la orden de compra!';
            // }

            // return next(new AppError(messageError, 500, err.code))
        }

        console.log('ID DE LA ORDEN,', {orderId: order.result.id});
        // 5. Return a successful response to the client with the order ID
        res.status(200).json({
            orderID: order.result.id,
        });
    },
);

function createRequest(moneyCode: string, finalPrice: number, nameItemBuy: string, descriptionItem: string) {
    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer('return=minimal');
    request.requestBody({
        currency: moneyCode,
        intent: 'AUTHORIZE',
        locale: 'en_US',
        purchase_units: [
            {
                amount: {
                    currency_code: moneyCode,
                    value: finalPrice,
                    breakdown: {
                        item_total: {
                            currency_code: moneyCode,
                            value: finalPrice,
                        },
                    },
                },
                // description: "Inversion Grupo de Juego 7x1",
                items: [
                    {
                        name: nameItemBuy,
                        quantity: '1',
                        description: descriptionItem,
                        category: 'DIGITAL_GOODS',
                        unit_amount: {
                            currency_code: moneyCode,
                            value: finalPrice,
                        },
                    },
                ],
            },
        ],
    });

    return request;
}

export const createAuthorization = catchAsync(async (req: Express.Request, res: Express.Response) => {
    const orderID = req.body.orderID;

    // 3. Call PayPal to create the authorization
    const request = new checkoutNodeJssdk.orders.OrdersAuthorizeRequest(orderID);
    let authorization;
    let authorizationID;
    request.requestBody({});

    try {
        authorization = await client().execute(request);

        // 4. Save the authorization ID to your database
        authorizationID = authorization.result.purchase_units[0].payments.authorizations[0].id;
        // await database.saveAuthorizationID(authorizationID);
    } catch (err) {
        // 5. Handle any errors from the call
        console.error(err);
        return res.status(500);
    }

    // 6. Return a successful response to the client
    res.status(200).json({authorization});
});

export const getOrderDetails = catchAsync(async (req: Express.Request, res: Express.Response) => {
    // 2a. Get the order ID from the request body
    const orderID = req.params.orderID;

    console.log({orderId: orderID});

    // 3. Call PayPal to get the transaction details
    const request = new checkoutNodeJssdk.orders.OrdersGetRequest(orderID);

    let order;
    try {
        order = await client().execute(request);
    } catch (err) {
        // 4. Handle any errors from the call
        console.error(err);
        return res.status(500);
    }

    // // 5. Validate the transaction details are as expected
    // if (order.result.purchase_units[0].amount.value !== '220.00') {
    //     res.status(400);
    // }

    // 6. Save the transaction in your database
    // await database.saveTransaction(orderID);

    // 7. Return a successful response to the client
    res.status(200).json({order});
});

export const payout = catchAsync(async (req: Express.Request, res: Express.Response, next: Express.NextFunction) => {
    const amountMoneyToPay = req.body.amountMoneyToPay;
    const emailPaypal = req.body.paypalEmail;
    // const email = 'gerencia@fumipgreen.com';

    getToken(next).then((resp: any) => {
        const uriPayout =
            envVars.ENVIRONMENT === 'production'
                ? 'https://api.paypal.com/v1/payments/payouts'
                : 'https://api.sandbox.paypal.com/v1/payments/payouts';
        const senderBatchId = crypto.randomBytes(12).toString('hex');
        const token = JSON.parse(resp);
        requestPaypal.post(
            {
                uri: uriPayout,
                headers: {
                    'content-type': 'application/json',
                    Authorization: 'Bearer ' + token.access_token,
                },
                body: JSON.stringify({
                    sender_batch_header: {
                        sender_batch_id: senderBatchId,
                        email_subject: 'Tienes un pago!',
                        email_message: 'Has recibido un pago! Gracias por jugar!!',
                    },
                    items: [
                        {
                            recipient_type: 'EMAIL',
                            amount: {
                                value: amountMoneyToPay,
                                currency: 'USD',
                            },
                            note: 'Gracias por jugar!!',
                            receiver: emailPaypal,
                        },
                    ],
                }),
            },
            (err, response: any, body) => {
                const payoutBody = JSON.parse(body);
                console.log(payoutBody); // TODO REEMPLAZAR POR EL LOGGER

                if (response.statusCode === 201) {
                    // LUEGO DE QUE EL PAGO SE HAYA ENVIADO AGREGAR FUNCIONALIDAD PARA DEDUCIR DEL DINERO RESTANTE LO QUE SE LE PAGO AL USUARIO
                    // Y SACARLO DE LA LISTA DE SOLICITADOS DE RECLAMO DE PAGO, LA CUAL ESTAS SOLICITADES ESTARIAN EN DOCUMENTO APARTE
                    return res.status(201).json({message: 'El pago se ha realizado correctamente!'});
                } else {
                    const error = JSON.parse(body);
                    console.log('Error Paypal', error); // TODO REEMPLAZAR POR EL LOGGER

                    if (error.name === INSUFFICIENT_FUNDS) {
                        return next(new AppError('Fondos insuficientes para realizar el pago!', 400, 'PAYPALERROR'));
                    } else {
                        return next(new AppError('Ha ocurrido un error al realizar el pago!', 400, 'PAYPALERROR'));
                    }
                }
            },
        );
    });
});

function getToken(next: Express.NextFunction) {
    const uri =
        envVars.ENVIRONMENT === 'production'
            ? 'https://api.paypal.com/v1/oauth2/token'
            : 'https://api.sandbox.paypal.com/v1/oauth2/token';

    return new Promise((resolve, reject) => {
        requestPaypal.post(
            {
                uri,
                headers: {
                    Accept: 'application/json',
                    'Accept-Language': 'en_US',
                    'content-type': 'application/x-www-form-urlencoded',
                },
                auth: {
                    user: envVars.PAYPAL_CLIENT_ID,
                    pass: envVars.PAYPAL_CLIENT_SECRET,
                },
                form: {
                    grant_type: 'client_credentials',
                },
            },
            (error, response, body) => {
                if (response.statusCode === 200) {
                    resolve(body);
                } else {
                    console.log('Error Paypal', body); // TODO REEMPLAZAR POR EL LOGGER
                    return next(
                        new AppError(
                            'Ha ocurrido un error al obtener el token de acceso de paypal!',
                            400,
                            'PAYPALERROR',
                        ),
                    );
                }
            },
        );
    });
}
