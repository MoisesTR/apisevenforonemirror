const { matchedData }  = require('express-validator/filter');

module.exports = app => {
    let methods = {};
    const models = app.db.core.models;

    methods.createRole = ( req, res, next ) => {
        const roleData = matchedData(req, {locations: ['body']});

        const role = new models.Role({...roleData});
        role
            .save()
            .then(() => res.status(201).json({message: 'Role added successful!'}))
            .catch(next)
    };

    methods.getRoles = (req, res, next) => {
        models.Role
            .find()
            .then( roles => {
                res.status(200)
                    .json(roles)
            })
            .catch(err => next(err))
    };

    methods.getRole = (req, res, next) => {
        const roleId = req.params.roleId;

        models.Role
            .findById( roleId )
            .then( role => {
                resultOrNotFound(res, role, 'Role');
            })
            .catch(err => next(err))
    };

    return methods;
};