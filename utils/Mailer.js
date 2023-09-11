const nodeMailer = require('nodemailer');
const mailConfig = require('../config/MailConfig');
const Mailgen = require('mailgen');
require('dotenv').config();

exports.sendMail = (to, subject, htmlContent) => {

    let MailGenerator = new Mailgen({
        theme: "default",
        product : {
            name: "Mailgen",
            link : 'https://mailgen.js/'
        }
    })

    let mail = MailGenerator.generate(htmlContent)

    const transport = nodeMailer.createTransport({
        host: mailConfig.HOST,
        port: mailConfig.PORT,
        secure: false,
        auth: {
            user: mailConfig.USERNAME,
            pass: mailConfig.PASSWORD,
        }
    })

    const options = {
        from: mailConfig.FROM_ADDRESS,
        to: to,
        subject: subject,
        html: mail
    }
    return transport.sendMail(options);
}
