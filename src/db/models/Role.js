'use strict';

module.exports = (Schema, model) => {

    const roleModel = new Schema({
        name: {
            type: String,
            unique: true,
            required: true,
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