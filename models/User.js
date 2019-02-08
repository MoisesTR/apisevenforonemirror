'use strict';
const {Schema, model} = require('mongoose');

const userSchema = new Schema({
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    }, 
    userName: {
        type: String,
        trim: true,
        required: true,
        lowercase: true,
        unique: true, 
        index: true,
    },
    email: {
        type: String,
        trim: true,
        unique: true
    },
    phones: {
        type:[String],
        required: true
    },
    birthDate: {
        type: Date,
        required: true
    },
    secretToken: {
        type: String, 
        required: true
    },
    isVerified: {
        type: Boolean,
        required: true
    },
    role: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Role'
    },
    passwordHash: {
        type: String,
        required: true
    },
    enable: {
        type: Boolean,
        required: true
    },
},{
    timestamps: {
        createdAt: 'createdAt',
        updatedAt: 'updatedAt',
    }
});

module.exports = model('User', userSchema);