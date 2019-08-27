import {ObjectId} from 'bson';

export type UserForLoginType = {
    _id: ObjectId;
    userName: string;
    firstName: string;
    lastName: string;
    provider: string;
    role: ObjectId;
    email: string;
    image: string;
};
