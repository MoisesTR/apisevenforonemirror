import envVars from '../../global/environment';
import sgMail from '@sendgrid/mail';
import {IUserDocument} from '../../db/interfaces/IUser';
import {EmailData} from '@sendgrid/helpers/classes/email-address';

let templateIds: { confirmAccount: string; recoverAccount: string; winnerNotification: string };
templateIds = {
    confirmAccount: envVars.CONFIRM_EMAIL,
    recoverAccount: envVars.RECOVER_ACCOUNT,
    winnerNotification: envVars.WINNER_NOTIFICATION,
};

sgMail.setApiKey(envVars.SENDGRID_KEY);
sgMail.setSubstitutionWrappers('{{', '}}');

const sendGenericMail = async (templateId: string, subject: string, to: EmailData[], extraData: any) => {
    await sgMail.send({
        from: {
            email: envVars.NO_REPLY_EMAIL,
            name: 'Seven for One'
        },
        to: [...to],
        dynamicTemplateData: {
            subject,
            ...extraData,
        },
        substitutionWrappers: ['{{', '}}'],
        templateId: templateId,
        subject
    });
};

export const sendConfirmationEmail = async (from: string, user: IUserDocument) => {
    await sendGenericMail(templateIds.confirmAccount, 'Bienvenido a Seven For One! confirma tu correo!', [{email: user.email}], {
        userName: user.userName,
        url: envVars.URL_HOST + '/confirm/' + user.secretToken + '/' + user.userName,
    });
};

export const recoverAccountEmail = async (user: IUserDocument, url: string) => {
    await sendGenericMail(templateIds.recoverAccount, 'Dont Reply! Recover your Account', [{email: user.email}], {
        userName: user.userName,
        url,
        lifeTime: 10
    });
};

export const winnerNotificationMail = async (user: IUserDocument, groupValue: number, claimPriceURL: string) => {
    await sendGenericMail(templateIds.winnerNotification, 'Dont Reply! Congratulations you win', [{email: user.email}], {
        userName: user.userName,
        groupValue,
        claimPriceURL
    });
};
