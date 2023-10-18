const nodeMailer = require('nodemailer');
const mailConfig = require('../config/MailConfig');
const Mailgen = require('mailgen');
require('dotenv').config();

exports.sendMail = (to, subject, htmlContent, file) => {

    let MailGenerator = new Mailgen({
        theme: "default",
        product: {
            name: "<b>NBTour</b>",
            link: 'https://youtube.com/'
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
    let options

    if (file) {
        options = {
            from: mailConfig.FROM_ADDRESS,
            to: to,
            subject: subject,
            html: mail,
            attachments: [
                {
                    filename: 'qrcode.png',
                    content: file.split(';base64,').pop(),
                    encoding: 'base64',
                    cid: 'qrcode',
                },
            ],
        }
    } else {
        options = {
            from: mailConfig.FROM_ADDRESS,
            to: to,
            subject: subject,
            html: mail,
        }
    }

    return transport.sendMail(options);
}
