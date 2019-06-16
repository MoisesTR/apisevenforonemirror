'use strict';

/**
 *
 * PayPal Node JS SDK dependency
 */
const checkoutNodeJssdk = require('@paypal/checkout-server-sdk');

/**
 *
 * Returns PayPal HTTP client instance with environment that has access
 * credentials context. Use this instance to invoke PayPal APIs, provided the
 * credentials have access.
 */
function client() {
    return new checkoutNodeJssdk.core.PayPalHttpClient(environment());
}

/**
 *
 * Set up and return PayPal JavaScript SDK environment with PayPal access credentials.
 * This sample uses SandboxEnvironment. In production, use ProductionEnvironment.
 *
 */
function environment() {
    let clientId = process.env.PAYPAL_CLIENT_ID || 'AesFU7Gm3IQFQTtJ_T9KW_a6DQIDebT7FBXizSgYhRaeiHxfyv6WoENa1dcbthiFyidViSkzevyTuauh';
    let clientSecret = process.env.PAYPAL_CLIENT_SECRET || 'EAPEBKhXVeGjr6hK9a0qro2GR7y7ef2EtcU3A0iRW_PJF1DLuYY9JQ1J7hLp9aonj7G7bfwcK1ISQQI6';

    return new checkoutNodeJssdk.core.LiveEnvironment(
        clientId, clientSecret
    );
}

async function prettyPrint(jsonData, pre=""){
    let pretty = "";
    function capitalize(string) {
        return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
    }
    for (let key in jsonData){
        if (jsonData.hasOwnProperty(key)){
            if (isNaN(key))
                pretty += pre + capitalize(key) + ": ";
            else
                pretty += pre + (parseInt(key) + 1) + ": ";
            if (typeof jsonData[key] === "object"){
                pretty += "\n";
                pretty += await prettyPrint(jsonData[key], pre + "    ");
            }
            else {
                pretty += jsonData[key] + "\n";
            }

        }
    }
    return pretty;
}

module.exports = {client: client, prettyPrint:prettyPrint};
