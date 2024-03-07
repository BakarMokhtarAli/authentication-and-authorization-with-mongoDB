const nodemailer = require('nodemailer');


const sendEmail = async (options) => {
    //1) create transporter
    const transporter = nodemailer.createTestAccount({
        host: "sandbox.smtp.mailtrap.io",
        port: 2525,
        auth: {
            user: "e043375506a030",
            pass: "********6778",
        }
    });
    //2) Define email options
    const mailOptions = {
        from: 'Bakar Mokhtar <hello@bakar.io>',
        to: options.email,
        subject: options.subject,
        text: options.message,
    };
    // 3) send the email
        await transporter.sendEmail;
   
}

module.exports = sendEmail;