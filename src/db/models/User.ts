'use strict';

import {model, Schema, Types} from 'mongoose';
import {IUser, IUserDocument, IUserModel} from '../interfaces/IUser';
import {ObjectId} from 'bson';
import crypto from 'crypto';
import {EModelNames} from '../interfaces/EModelNames';

const validGenders = {
    values: ['M', 'F'],
    message: '{VALUE} es un genero incorrecto!',
};

const userSchema = new Schema(
    {
        firstName: {
            type: String,
            required: true,
        },
        lastName: {
            type: String,
            required: true,
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
            unique: true,
        },
        phones: {
            type: [String],
        },
        birthDate: {
            type: Date,
        },
        gender: {
            type: String,
            enum: validGenders,
        },
        secretToken: {
            type: String,
        },
        isVerified: {
            type: Boolean,
            required: true,
        },
        role: {
            type: Schema.Types.ObjectId,
            required: true,
            ref: EModelNames.Role,
        },
        image: {
            type: String,
        },
        passwordHash: {
            type: String,
            required: true,
            select: false
        },
        enabled: {
            type: Boolean,
            required: true,
        },
        provider: {
            type: String,
            default: 'none',
        },
        passwordChangeAt: Date,
        passwordResetExp: Date
    },
    {
        timestamps: true,
    },
);

userSchema.methods.verifyToken = function() {
    // Descomentar secretToken hasta que el metodo refresh token funcione correctamente
    // this.secretToken = "";
    this.isVerified = true;
    this.enabled = true;

    return this.save();
};

userSchema.methods.updateUser = function({firstName, lastName, phones, birthDate, gender}: IUser) {
    this.firstName = firstName;
    this.lastName = lastName;
    this.phones = phones;
    this.birthDate = birthDate;
    this.gender = gender;
    return this.save();
};

userSchema.methods.getPurchaseHistory = function() {
    return this.model('purchaseHistory').find();
};

userSchema.methods.getPurchaseHistoryById = function(userId: string | Types.ObjectId) {
    return this.model('purchaseHistory')
        .aggregate([
            {$match: {userId: new ObjectId(userId)}},
            {$lookup: {from: 'groupgames', localField: 'groupId', foreignField: '_id', as: 'groupInfo'}},
            {$unwind: {path: '$groupInfo', preserveNullAndEmptyArrays: true}},
            {
                $project: {
                    userId: 1,
                    action: 1,
                    'groupInfo._id': 1,
                    'groupInfo.initialInvertion': 1,
                    quantity: 1,
                    moneyDirection: 1,
                    createdAt: 1,
                    updatedAt: 1,
                },
            },
        ])
        .exec();
};

userSchema.methods.createPasswordResetToken = function() {
    const resetToken = crypto.randomBytes(32).toString('hex');
    this.secretToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');
    // Only valid for the next hout
    this.passwordResetExp = Date.now() + 60 * 60 * 1000;

    console.log(
        { resetToken },
        this.passwordResetToken
    );
    return resetToken;
};


export default model<IUserDocument, IUserModel>(EModelNames.User, userSchema);
