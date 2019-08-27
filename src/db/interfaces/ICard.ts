import {Document, Model} from 'mongoose';

export interface ICardAttributes {
    cardNumber: string;
    cartType: string;
    expirationDate: Date;
    enable: boolean;
    createdAt: Date;
    UpdatedAt: Date;
}
export interface ICardDocument extends Document, ICardAttributes {}

export interface ICardModel extends Model<ICardDocument> {}
