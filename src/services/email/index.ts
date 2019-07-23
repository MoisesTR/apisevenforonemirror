import envVars from '../../global/environment';
import sgMail from '@sendgrid/mail';
import {MailData} from '@sendgrid/helpers/classes/mail';
import {IUserDocument} from '../../db/interfaces/IUser';

let templateIds: { confirmAccount: string, recoverAccount: string };
templateIds = {
    confirmAccount: 'd-3f1db392e2b94207b174951603163934',
    recoverAccount: 'd-72f36268236e4ef08dfef3807c9b6508'
};

sgMail.setApiKey(envVars.SENDGRID_KEY);

export const sendConfirmationEmail = async (from: string, user: IUserDocument) => {
    const msg: MailData = {
        to: user.email,
        from: envVars.ADMON_EMAIL,
        subject: 'Welcome to Seven for One! Confirm Your Email',
        // Custom Template
        templateId: templateIds.confirmAccount,
        substitutionWrappers: ['{{', '}}'],
        substitutions: {
            userName: user.userName,
            url: envVars.URL_HOST + '/confirm/' + user.secretToken + '/' + user.userName
        }
    };
    const resp = await sgMail.send(msg);
};

export const recoverAccountEmail = async (from: string, user: IUserDocument) => {
    const msg: MailData = {
        to: user.email,
        from: envVars.ADMON_EMAIL,
        subject: 'Dont Reply! Recover your Account',
        // Custom Template
        templateId: templateIds.recoverAccount,
        substitutionWrappers: ['{{', '}}'],
        substitutions: {
            userName: user.userName
        }
    };
    const resp = await sgMail.send(msg);
};