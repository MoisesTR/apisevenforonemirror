// 1. Set up your server to make calls to PayPal

// 1a. Import the SDK package
const logger = require('../utils/logger');
const paypal = require('@paypal/checkout-server-sdk');

// 1b. Import the PayPal SDK client that was created in `Set up Server-Side SDK`.
/**
 *
 * PayPal HTTP client dependency
 */
const payPalClient = require('../libs/paypalClient');

const checkoutNodeJssdk = require('@paypal/checkout-server-sdk');

// 2. Set up your server to receive a call from the client
module.exports  = app => {


    const methods = {};

    methods.createPaypalTransaction = async (req, res) => {

        // 3. Call PayPal to set up a transaction
        const finalPrice = req.body.finalPrice;

        const moneyCode = 'USD';
        const descriptionItem = "Inversion en grupo de juego 7x1";
        const nameItemBuy = "Inversion Grupo";

        logger.info('Creando transaccion paypal');

        let order;

        try {

            if (finalPrice <= 0) {
                throw { status: 500, code: "EERPAYPALPRICE", message: "El precio de la compra no puede ser menor o igual a cero!" };
            }

            const request = createRequest(moneyCode, finalPrice.toString(), nameItemBuy, descriptionItem);

            order = await payPalClient.client().execute(request);
        } catch (err) {

            // 4. Handle any errors from the call
            logger.error('Error Paypal', err);

            let messageError = '';
            if (err.code === 'EERPAYPALPRICE') {
                messageError = err.message;
            } else {
                messageError = 'Ha ocurrido un error con los datos de la orden de compra!';
            }

            return res.status(500).json({error: messageError});
        }

        // 5. Return a successful response to the client with the order ID
        return res.status(200).json({
            orderID: order.result.id
        });
    };

    methods.createAuthorizationTransaction = async (req, res) => {

        // 2a. Get the order ID from the request body
        const orderID = req.body.orderID;

        // 3. Call PayPal to create the authorization
        const request = new checkoutNodeJssdk.orders.OrdersAuthorizeRequest(orderID);
        let authorizationID;
        request.requestBody({});

        try {
            const authorization = await payPalClient.client().execute(request);

            // 4. Save the authorization ID to your database
            authorizationID = authorization.result.purchase_units[0]
                .payments.authorizations[0].id
            // await database.saveAuthorizationID(authorizationID);

        } catch (err) {

            // 5. Handle any errors from the call
            console.error(err);
            return res.send(500);
        }

        // 6. Return a successful response to the client
        return res.send(200);
        // return res.send(200).json({
        //     authorizationID: authorizationID
        // });
    };

    methods.captureAuthorization = async (req, res) => {

        // 2. Get the authorization ID from your database
        const authorizationID = req.body.authorizationID;

        // 3. Call PayPal to capture the authorization
        const request = new checkoutNodeJssdk.payments.AuthorizationsCaptureRequest(authorizationID);
        request.requestBody({});
        try {
            const capture = await payPalClient.client().execute(request);

            // 4. Save the capture ID to your database for future reference.
            const captureID = capture.result.purchase_units[0]
                .payments.captures[0].id;
            //await database.saveCaptureID(captureID);

        } catch (err) {

            // 5. Handle any errors from the call
            console.error(err);
            return res.send(500);
        }

        // 6. Return a successful response to the client
        return res.send(200);
    };


    function createRequest(moneyCode, finalPrice, nameItemBuy, descriptionItem) {
        const request = new paypal.orders.OrdersCreateRequest();
        request.prefer("return=representation");
        request.requestBody({
            currency: moneyCode,
            intent: 'CAPTURE',
            locale: 'en_US',
            purchase_units: [
                {
                    amount: {
                        currency_code: moneyCode,
                        value: finalPrice,
                        breakdown: {
                            item_total: {
                                currency_code: moneyCode,
                                value: finalPrice
                            }
                        }
                    },
                    // description: "Inversion Grupo de Juego 7x1",
                    items: [
                        {
                            name: nameItemBuy,
                            quantity: '1',
                            description: descriptionItem,
                            category: "DIGITAL_GOODS",
                            unit_amount: {
                                currency_code: moneyCode,
                                value: finalPrice
                            }
                        }
                    ]
                }
            ]
        });

        return request;
    }

    return methods;
};