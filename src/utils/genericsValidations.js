const { validationResult } = require('express-validator/check');
const {ObjectId} = require('mongodb');


exports.isValidDate = (value, fieldName) => {
    let date = new Date(value);

    if(isNaN(date)) {
        throw new Error(`The field ${fieldName.path} must be a valid Date.`);
    }
    date = date.toISOString();
    return date;
};

exports.isObjectId = (value) => {
    console.log(ObjectId.isValid())
    return ObjectId(value);
};

exports.validsParams = (req, res, next) => {
    const errors = validationResult(req);
    if ( !errors.isEmpty() )
        return res.status(400).json(errors.array());
    next();
};