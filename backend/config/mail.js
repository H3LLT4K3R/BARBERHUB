import 'dotenv/config';
import nodemailer from 'nodemailer';

const isResend = Boolean(process.env.RESEND_API_KEY);

const transporter = isResend
    ? nodemailer.createTransport({
        host: 'smtp.resend.com',
        port: 465,
        secure: true,
        auth: {
            user: 'resend',
            pass: process.env.RESEND_API_KEY,
        },
        connectionTimeout: 5000,
        greetingTimeout: 5000,
        socketTimeout: 5000,
    })
    : nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.MAIL_USER,
            pass: process.env.MAIL_PASS,
        },
        connectionTimeout: 5000,
        greetingTimeout: 5000,
        socketTimeout: 5000,
    });

export default transporter;

