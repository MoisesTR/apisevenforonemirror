'use strict';

var validRoles = {
    values: ['ADMIN', 'USER'],
    message: '{VALUE} it is not a permitted role'
};
module.exports = (Schema, model) => {

    const roleModel = new Schema({
        name: {
            type: String,
            unique: true,
            required: true,
            enum : validRoles
        },
        description: {
            type: String,
            required: true
        }
    },{
        timestamps: true
    });

   return model('Role', roleModel);
};