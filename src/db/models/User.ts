'use strict';

import {model, Schema, Types} from "mongoose";
import {IUser, IUserDocument, IUserModel} from "../interfaces/IUser";

const validGenders = {
    values: ['M', 'F'],
    message: '{VALUE} is an invalid gender'
};

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
        type: [String]
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
        , default: 'none'
    }
}, {
    timestamps: true
});

userSchema.methods.verifyToken = function () {
    // Descomentar secretToken hasta que el metodo refresh token funcione correctamente
    // this.secretToken = "";
    this.isVerified = true;
    this.enabled = true;

    return this.save();
};

userSchema.methods.updateUser = function ({ firstName, lastName, phones, birthDate, gender}: IUser) {
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

userSchema.methods.getPurchaseHistoryById = function (userId: string | Types.ObjectId) {
    return this.model('PurchaseHistory').find({userId: userId})
};

export default model<IUserDocument, IUserModel>('User', userSchema);


