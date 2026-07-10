import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'bartfestmixology@gmail.com',
        pass: 'oliw hvov sztv fwsi' // Dejado exactamente como te funciona
    }
});

export default transporter;