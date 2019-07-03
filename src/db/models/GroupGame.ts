"use strict";
import mongoose, {model, Schema} from "mongoose";
import {IGroupGameDocument, IMember, IMemberDocument} from "../interfaces/IGroupGame";
import envVars from "../../global/environment";
import {ObjectId} from "bson";
import Notification, {ENotificationTypes} from './Notification';
import {mainSocket} from '../../sockets/socket';
import {GROUP_ACTIVITY, TOP_WINNERS, WIN_EVENT} from '../../sockets/events/gameSocket';
import {redisPub} from '../../redis/redis';
import {socketKey} from '../../redis/keys/dynamics';

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
        if ( !!this.uniqueChance ) {
            const alreadyIndex = this.members.find((member: IMemberDocument) => member.userId.equals(memberData.userId));
            if ( !!alreadyIndex )
                throw {status: 409, message: "This user is already member!"};
        }

        const user = await this.model("user")
                        .findById(memberData.userId);
        // Check user existence
        if ( !user ) {
            throw {status: 404, message: "User not found!"};
        }

        if ( membersSize >= envVars.MAX_MEMBERS_PER_GROUP ) {
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

            const newNotification = this.model('notification')({
                notificationType: ENotificationTypes.WIN,
                userId: winner.userId,
                content: `Congratulations ${winner.userName} you has been winner of the $${this.initialInvertion} group!`,
                groupId: this.groupId
            });
            const userHistory = this.model("purchaseHistory")({
                userId: winner.userId,
                action: "win",
                groupId: this._id,
                quantity: this.initialInvertion * 6,
                payReference: "pay prize reference"
            });
            this.winners++;

            const socketWinner = await redisPub.get(socketKey(winner.userName));
            if (!!socketWinner && !!mainSocket.sockets.connected[socketWinner]) {
                mainSocket.to(socketWinner)
                .emit(WIN_EVENT, {
                    content: `Congratulations you has been winner of the $${this.initialInvertion} group!`,
                    date: new Date()
                });
            }
            await newNotification.save();
            await userHistory.save();
        }
        console.log('Players', this.members);
        this.members.push({...memberData});
        console.log('Players update', this.members);

        this.totalInvested += this.initialInvertion;
        await this.save();
        const userHistory = this.model("purchaseHistory")({
            userId: memberData.userId,
            action: "invest",
            groupId: this._id,
            quantity: this.initialInvertion,
            payReference: payReference
        });
        await userHistory.save();
        // TODO: Save notification user win
        mainSocket.emit(TOP_WINNERS, user);
        mainSocket.emit(`${GROUP_ACTIVITY}${this.initialInvertion}`, memberData);
        await session.commitTransaction();
    } catch (_err) {
        await session.abortTransaction();
    }
};

export default model<IGroupGameDocument>("GroupGame", groupSchema);