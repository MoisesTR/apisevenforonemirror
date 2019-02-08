const {Schema, model} = require('mongoose');

const roleModel = new Schema({
    name: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        require: true
    },
    createdAt:{ 
        type: Date,
        required: true
    },
    updatedAt: {
        type: Date, 
        require: Date.now
    }
});

module.exports = model('Role', roleModel);