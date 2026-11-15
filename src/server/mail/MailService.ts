import {createTransport, type Transporter} from 'nodemailer';
import getConfig from '@/server/config/getConfig';
import ApiError from '@/server/error/ApiError';
import logger from '@/server/log/logger';
import type Mail from '@/server/mail/Mail';


const state: { transporter: Transporter | null } = {transporter: null};

/**
 * All e-mails are sent by the system through the SMTP server from the environment. Tenants do not
 * configure anything: the sender shows "<company> via <app>", replies go to the tenant address.
 */
export default class MailService {
    static isEnabled(): boolean {
        return getConfig().smtp !== null;
    }

    async send(mail: Mail): Promise<void> {
        const config = getConfig();
        if (config.smtp === null) {
            throw new ApiError(503, 'mail_disabled', 'E-mail sending is not configured on this instance.');
        }
        if (state.transporter === null) {
            state.transporter = createTransport({
                auth:   config.smtp.user === '' ? undefined : {pass: config.smtp.password, user: config.smtp.user},
                host:   config.smtp.host,
                port:   config.smtp.port,
                secure: config.smtp.secure,
            });
        }
        const address = config.mailFrom ?? (config.smtp.user.includes('@') ? config.smtp.user : `noreply@${config.smtp.host}`);
        const name = mail.fromName === undefined ? config.appName : `${mail.fromName} via ${config.appName}`;
        await state.transporter.sendMail({
            attachments: mail.attachments,
            from:        {address, name},
            replyTo:     mail.replyTo ?? undefined,
            subject:     mail.subject,
            text:        mail.text,
            to:          mail.to,
        });
        logger.info(`Mail sent to ${mail.to}: ${mail.subject}`);
    }
}
