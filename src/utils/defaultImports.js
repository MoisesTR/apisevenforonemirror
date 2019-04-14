const {matchedData, sanitize} = require('express-validator/filter');
const { query,param,body,check,oneOf, validationResult } = require('express-validator/check');

module.exports = {
    matchedData,
    sanitize,
    query,
    param, 
    body, 
    oneOf,
    check, 
    validationResult,
}