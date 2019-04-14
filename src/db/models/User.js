'use strict';

module.exports = ( Schema, model ) => {

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
            type:[String]
        },
        birthDate: {
            type: Date
        },
        gender: {
           type: String
        },
        secretToken: {
            type: String,
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
        image: {
            type: String
        },
        passwordHash: {
            type: String,
            required: true
        },
        enabled: {
            type: Boolean,
            required: true
        },
        google : {
            type: Boolean,
            default: false
        },
        facebook : {
            type: Boolean,
            default: false
        }
    },{
        timestamps: true
    });

    userSchema.methods.verifyToken = function( ) {
        this.secretToken = "";
        this.isVerified = true;

        return this.save();
    };

    userSchema.methods.getPurchaseHistory = function () {
        return this.model('PurchaseHistory').find()
    };
    return model('User', userSchema);
};