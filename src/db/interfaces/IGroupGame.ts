import {Document, Model, Types} from 'mongoose';
import ObjectId = Types.ObjectId;

export interface IMember {
    userId: ObjectId;
    userName: string;
    image: string;
}
export interface IMemberDocument extends IMember, Document {}

export interface IMemberModel extends Model<IMemberDocument> {}

export interface IGroupGame {
    initialInvestment: number;
    members: Types.DocumentArray<IMemberDocument>;
    lastWinner: ObjectId;
    winners: number;
    totalInvested: number;
    uniqueChance: boolean;
    enabled: boolean;
}
export interface IGroupGameDocument extends Document, IGroupGame {
    addMember: (memberData: IMember, payReference: string) => Promise<any>;
    removeMember: (memberId: Types.ObjectId) => Promise<IGroupGameDocument>;
    changeActiveState: (enabled: boolean) => void;
}
export interface IGroupGameModel extends Model<IGroupGameDocument> {}
