'use strict';

/**
 *
 * PayPal Node JS SDK dependency
 */
// @ts-ignore
import checkoutNodeJssdk from '@paypal/checkout-server-sdk';

import envVars from './global/environment';

/**
 *
 * Returns PayPal HTTP client instance with environment that has access
 * credentials context. Use this instance to invoke PayPal APIs, provided the
 * credentials have access.
 */
export function client() {
    return new checkoutNodeJssdk.core.PayPalHttpClient(environment());
}

/**
 *
 * Set up and return PayPal JavaScript SDK environment with PayPal access credentials.
 * This sample uses SandboxEnvironment. In production, use ProductionEnvironment.
 *
 */
function environment() {
    console.log('Ambiente', envVars.ENVIRONMENT);
    if (envVars.ENVIRONMENT === 'production') {
        return new checkoutNodeJssdk.core.LiveEnvironment(envVars.PAYPAL_CLIENT_ID, envVars.PAYPAL_CLIENT_SECRET);
    } else {
        return new checkoutNodeJssdk.core.SandboxEnvironment(envVars.PAYPAL_CLIENT_ID, envVars.PAYPAL_CLIENT_SECRET);
    }
}
