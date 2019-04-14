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
            type:[String],
            required: true
        },
        birthDate: {
            type: Date,
            required: true
        },
        gender: {
           type: String,
           required: true
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
        passwordHash: {
            type: String,
            required: true
        },
        enabled: {
            type: Boolean,
            required: true
        },
    },{
        timestamps: true
    });

    userSchema.methods.verifyToken = function( ) {
        this.secretToken = "";
        this.isVerified = true;

        return this.save();
    };
    return model('User', userSchema);
};