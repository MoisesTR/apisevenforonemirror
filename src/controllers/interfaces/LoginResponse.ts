import {UserForLoginType} from './UserForLoginType';

export interface ILoginResponse {
    user: UserForLoginType;
    token: string;
    expiration: number;
    refreshToken: string;
}