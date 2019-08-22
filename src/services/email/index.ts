import envVars from '../../global/environment';
import sgMail from '@sendgrid/mail';
import {MailData} from '@sendgrid/helpers/classes/mail';
import {IUserDocument} from '../../db/interfaces/IUser';

let templateIds: {confirmAccount: string; recoverAccount: string};
templateIds = {
    confirmAccount: 'd-3f1db392e2b94207b174951603163934',
    recoverAccount: 'd-72f36268236e4ef08dfef3807c9b6508',
};

sgMail.setApiKey(envVars.SENDGRID_KEY);
sgMail.setSubstitutionWrappers('{{', '}}');

export const sendConfirmationEmail = async (from: string, user: IUserDocument) => {
    const msg = {
        to: user.email,
        from: envVars.ADMON_EMAIL,
        // Custom Template
        templateId: templateIds.confirmAccount,
        // substitutionWrappers: ['{{', '}}'],
        dynamic_template_data: {
            subject: 'Bievenido a Seven For One! confirma tu correo!',
            userName: user.userName,
            url: envVars.URL_HOST + '/confirm/' + user.secretToken + '/' + user.userName,
        },
    };

    sgMail
        .send(msg)
        .then(() => {
            console.log('El correo se ha enviado correctamente!');
        })
        .catch(error => {
            //Log friendly error
            console.error(error.toString());

            //Extract error msg
            const {message, code, response} = error;

            //Extract response msg
            const {headers, body} = response;
        });
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
            userName: user.userName,
        },
    };
    await sgMail.send(msg);
};

