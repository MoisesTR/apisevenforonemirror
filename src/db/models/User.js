'use strict';

const validGenders = {
    values : ['M', 'F'],
    message: '{VALUE} is an invalid gender'
};
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
           , enum: validGenders
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
        provider: {
            type: String
            , default : 'none'
        }
    },{
        timestamps: true
    });

    userSchema.methods.verifyToken = function( ) {
        // Descomentar secretToken hasta que el metodo refresh token funcione correctamente
        // this.secretToken = "";
        this.isVerified = true;
        this.enabled = true;

        return this.save();
    };

    userSchema.methods.updateUser = function( {firstName, lastName, phones, role, birthDate, gender} ) {
        this.firstName = firstName;
        this.lastName = lastName;
        this.phones = phones;
        this.birthDate = birthDate;
        this.gender = gender;
        return this.save();
    };

    userSchema.methods.getPurchaseHistory = function () {
        return this.model('PurchaseHistory').find()
    };

    userSchema.methods.getPurchaseHistoryById = function (userId) {
        return this.model('PurchaseHistory').find({userId: userId})
    };

    return model('User', userSchema);
};
