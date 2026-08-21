import 'dotenv/config';
import nodemailer from 'nodemailer';
import { Resend } from 'resend';

const isResend = Boolean(process.env.RESEND_API_KEY);
const resend = isResend ? new Resend(process.env.RESEND_API_KEY) : null;

const nodemailerTransporter = !isResend ? nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
    },
    connectionTimeout: 5000,
    greetingTimeout: 5000,
    socketTimeout: 5000,
}) : null;

const transporter = {
    sendMail: async (options) => {
        if (isResend) {
            try {
                const { data, error } = await resend.emails.send({
                    from: options.from,
                    to: options.to,
                    subject: options.subject,
                    html: options.html,
                });
                
                if (error) {
                    throw error;
                }
                return data;
            } catch (err) {
                console.error("Error from Resend SDK:", err);
                throw err;
            }
        } else {
            return nodemailerTransporter.sendMail(options);
        }
    }
};

export default transporter;
