'use strict';
import mongoose, {model, Schema} from 'mongoose';
import {IGroupGameDocument, IMember, IMemberDocument} from '../interfaces/IGroupGame';
import envVars from '../../global/environment';
import {ObjectId} from 'bson';
import {ENotificationTypes} from './Notification';
import {gameGroups, mainSocket} from '../../sockets/socket';
import {redisPub} from '../../redis/redis';
import {IUserDocument} from '../interfaces/IUser';
import {EGameEvents} from '../../sockets/constants/game';
import {EMainEvents} from '../../sockets/constants/main';
import DynamicKey from '../../redis/keys/dynamics';
import AppError from '../../classes/AppError';
import {EModelNames} from '../interfaces/EModelNames';
import {winnerNotificationMail} from '../../services/email';

export const memberSchema: Schema = new Schema(
    {
        userId: {
            type: ObjectId,
            ref: EModelNames.User,
        },
        userName: {
            type: Schema.Types.String,
            required: true,
        },
        image: {
            type: Schema.Types.String,
        },
    },
    {
        timestamps: true,
    },
);

const groupSchema: Schema = new Schema(
    {
        initialInvertion: {
            type: Schema.Types.Number,
            required: true,
            unique: true,
            index: true,
        },
        members: [memberSchema],
        lastWinner: {
            userId: Schema.Types.ObjectId,
            firstName: String,
            userName: String,
            image: String,
            required: false,
        },
        winners: {
            type: Schema.Types.Number,
            required: true,
            default: 0,
        },
        totalInvested: {
            type: Schema.Types.Number,
            required: true,
            default: 0,
        },
        uniqueChance: {
            type: Boolean,
            default: false,
        },
        enabled: {
            type: Boolean,
            required: true,
            default: true,
        },
    },
    {
        timestamps: true,
    },
);

groupSchema.methods.removeMember = async function (memberId: string | ObjectId) {
    console.log(this.members);
    // const memberIdObj = ( typeof memberId === "string") ? new ObjectId( memberId) : memberId;
    // console.log(Types.ObjectId(memberId));
    // this.members.forEach((member: IMemberDocument) => {
    //     console.log(member.userId.equals(memberIdObj));
    // });
    const removeMember = this.members.find((member: IMemberDocument) => member.userId.equals(memberId));
    if (!removeMember) {
        throw new AppError('Este usuario no es miembro de este grupo!', 404, '');
    }
    await removeMember.remove();

    return this.save();
};

groupSchema.methods.addMember = async function (memberData: IMember, payReference: string) {
    const session = await mongoose.startSession();
    try {
        session.startTransaction();
        const membersSize = this.members.length;
        if (!!this.uniqueChance) {
            const alreadyIndex = this.members.find((member: IMemberDocument) => member.userId.equals(memberData.userId));
            if (!!alreadyIndex) {
                throw new AppError('Este usuario ya es miembro!', 409, 'AEXIST');
            }
        }

        const user: IUserDocument = await this.model('user').findById(memberData.userId);
        // Check user existence
        if (!user) {
            throw new AppError('Usuario no encontrado', 404, 'UNFOUND');
        }

        if (membersSize >= envVars.MAX_MEMBERS_PER_GROUP) {
            const winner = this.members.shift();
            /**
             * TODO: Create pay prize reference
             */
            this.lastWinner = {
                userId: winner._id,
                userName: winner.userName,
                firstName: winner.firstName,
                image: winner.image,
            };

            const newNotification = this.model('notification')({
                notificationType: ENotificationTypes.WIN,
                userId: winner.userId,
                content: `Felicitaciones ${winner.userName} usted ha sido el ganador en el grupo de $${this.initialInvertion}!`,
                groupId: this.groupId,
            });
            try {
                await winnerNotificationMail(winner, this.initialInvestment.toFixed(), '');
            } catch (_err) {
                //TODO: handle
            }
            const userHistory = this.model('purchaseHistory')({
                userId: winner.userId,
                action: 'win',
                groupId: this._id,
                quantity: this.initialInvertion * 6,
                payReference: 'pay prize reference',
            });
            this.winners++;

            const socketWinner = await redisPub.hget(DynamicKey.hash.socketsUser(winner.userName), 'main');
            mainSocket.to('admins').emit(EMainEvents.SOMEONE_WIN, {
                message: 'Someone user has won!',
                groupId: this._id,
                userId: winner._id,
            });
            if (!!socketWinner && !!mainSocket.sockets.connected[socketWinner]) {
                mainSocket.to(socketWinner).emit(EMainEvents.WIN_EVENT, {
                    userId: winner.userId,
                    content: `Felicitaciones has sido ganador en el grupo de $${this.initialInvertion}!`,
                    date: new Date(),
                });
            }
            await newNotification.save();
            await userHistory.save();
        }
        this.members.push({...memberData});

        this.totalInvested += this.initialInvertion;
        await this.save();
        const userHistory = this.model('purchaseHistory')({
            userId: memberData.userId,
            action: 'invest',
            groupId: this._id,
            quantity: this.initialInvertion,
            payReference: payReference,
        });
        await userHistory.save();
        // TODO: Save notification user win
        // mainSocket.emit(EMainEvents.WIN_EVENT, {userName: user.userName,groupPrice:this.initialInvestment, image: user.image});
        console.log(`${EGameEvents.GROUP_ACTIVITY}${this.initialInvertion}`, memberData);
        gameGroups.emit(`${EGameEvents.GROUP_ACTIVITY}${this.initialInvertion}`, {
            image: memberData.image,
            userName: memberData.userName,
        });
        await session.commitTransaction();
    } catch (_err) {
        await session.abortTransaction();
        throw _err;
    }
};

groupSchema.methods.changeActiveState = function (enabled: boolean) {
    if ((this.members.length > 0) && !enabled) {
        throw new AppError('This action cannot be performed first, get the group members empty.', 403);
    }
    this.enabled = enabled;
    this.updatedAt = new Date();
};

export default model<IGroupGameDocument>(EModelNames.GroupGame, groupSchema);
