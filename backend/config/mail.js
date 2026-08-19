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
    })
    : nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.MAIL_USER,
            pass: process.env.MAIL_PASS,
        },
    });

export default transporter;

