const nodemailer = require('nodemailer');
const CONFIG = require('../configs/global.configs');

let transporter = nodemailer.createTransport({
    service: CONFIG.mail_service_provider,
    port: 587,
    secure: false,
    requireTLS: true,
    auth: {
        user: CONFIG.mail_email_id,
        pass: CONFIG.mail_password,
    },
});

const sendVerificationEmail = async function (to, code) {
    let options = {
        from: CONFIG.mail_email_id,
        to: to,
        subject: 'Verify your email for NFT Marketplace',
        text: 'Your verification code is: ' + code.toString()
    }
    
    let info;
    try {
        info = await transporter.sendMail(options);
    } catch (error) {
        console.log("Send mail error:", error);
        return false;
    }

    if (info.accepted.length > 0) {
        return true;
    } else {
        return false;
    }
}
module.exports.sendVerificationEmail = sendVerificationEmail;

const sendErrorReport = async function (subject, text) {
    let options = {
        from: CONFIG.mail_email_id,
        to: CONFIG.report_receiver,
        subject: subject,
        text: text
    }
    
    let info;
    try {
        info = await transporter.sendMail(options);
    } catch (error) {
        console.log("Send mail error:", error);
        return false;
    }

    if (info.accepted.length > 0) {
        return true;
    } else {
        return false;
    }
}
module.exports.sendErrorReport = sendErrorReport;