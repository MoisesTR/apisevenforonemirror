"use strict";
import mongoose, {model, Schema} from "mongoose";
import {IGroupGameDocument, IMember, IMemberDocument} from "../interfaces/IGroupGame";
import envVars from "../../global/environment";
import {ObjectId} from "bson";
import Notification from './Notification';

export const memberSchema: Schema = new Schema({
    userId: {
        type: ObjectId,
        ref: "User"
    },
    userName: {
        type: Schema.Types.String,
        required: true
    },
    image: {
        type: Schema.Types.String,
    }
}, {
    timestamps: true
});

const groupSchema: Schema = new Schema({
    initialInvertion: {
        type: Schema.Types.Number,
        required: true,
        unique: true,
        index: true
    },
    members: [memberSchema],
    lastWinner: {
        userId: Schema.Types.ObjectId,
        firstName: String,
        userName: String,
        image: String,
        required: false
    },
    winners: {
        type: Schema.Types.Number,
        required: true,
        default: 0
    },
    totalInvested: {
        type: Schema.Types.Number,
        required: true,
        default: 0
    },
    uniqueChance: {
        type: Boolean,
        default: false
    },
    enabled: {
        type: Boolean,
        required: true,
        default: true
    }
}, {
    timestamps: true
});

groupSchema.methods.removeMember = async function (memberId: string | ObjectId) {
    console.log(this.members);
    // const memberIdObj = ( typeof memberId === "string") ? new ObjectId( memberId) : memberId;
    // console.log(Types.ObjectId(memberId));
    // this.members.forEach((member: IMemberDocument) => {
    //     console.log(member.userId.equals(memberIdObj));
    // });
    const removeMember = this.members.find((member: IMemberDocument) => member.userId.equals(memberId));
    if (!removeMember) {
        throw  {status: 404, message: "This user is not a member of this group!"};
    }
    await removeMember.remove();

    return this.save();
};

groupSchema.methods.addMember = async function (memberData: IMember, payReference: string) {
    const session = await mongoose.startSession();
    try {
        session.startTransaction();
        const membersSize = this.members.length;
        const alreadyIndex = this.members.find((member: IMemberDocument) => member.userId.equals(memberData.userId));

        if (alreadyIndex && !!this.uniqueChance) {
            throw {status: 409, message: "This user is already member!"};
        }

        const user = await this.model("User").findById(memberData.userId);
        if (!user) {
            throw {status: 404, message: "User not found!"};
        }

        if (membersSize >= envVars.MAX_MEMBERS_PER_GROUP) {
            const winner = this.members.shift();
            /**
             * TODO: Create pay prize reference
             */
            this.lastWinner = {
                userId: user._id,
                userName: user.userName,
                firstName: user.firstName,
                image: user.image
            };

            const userHistory = this.model("PurchaseHistory")({
                userId: winner.userId,
                action: "win",
                groupId: this._id,
                quantity: this.initialInvertion * 6,
                payReference: "pay prize reference"
            });
            this.winners++;

            await userHistory.save();
        }
        this.members.push({...memberData});

        this.totalInvested += this.initialInvertion;
        await this.save();
        const userHistory = this.model("PurchaseHistory")({
            userId: memberData.userId,
            action: "invest",
            groupId: this._id,
            quantity: this.initialInvertion,
            payReference: payReference
        });
        await userHistory.save();
        // TODO: Save notification user win
        new Notification({

        })
        session.commitTransaction();
    } catch (_err) {
        session.abortTransaction();
        return Promise.reject(_err);
    }
};

export default model<IGroupGameDocument>("GroupGame", groupSchema);
