const {matchedData, sanitize} = require('express-validator/filter');
const { query,param,body,check,oneOf, validationResult } = require('express-validator/check');
const resultOrNotFound = ( resp, result, name ) => {
    const cnf = {status: !result ? 404 : 200, message: `${name} not found!`};
    resp.status(cnf.status)
        .json(!result ? cnf : result)
};

module.exports = {
    matchedData,
    sanitize,
    query,
    param, 
    body, 
    oneOf,
    check, 
    validationResult,
    resultOrNotFound
};