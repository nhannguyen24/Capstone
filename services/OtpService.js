const db = require('../models');
const { Op } = require('sequelize');
const OTP_TYPE = require("../enums/OtpTypeEnum")
const mailer = require("../utils/MailerUtil")
const bcrypt = require('bcryptjs');
const hashOtpCode = otpCode => bcrypt.hashSync(otpCode, bcrypt.genSaltSync(8));

const validateOtp = (req) => new Promise(async (resolve, reject) => {
    try {
        const otpId = req.query.otpId
        const otpCode = req.query.otpCode
        const otpType = req.query.otpType

        const otp = await db.Otp.findOne({
            where: {
                otpId: otpId,
                otpType: otpType
            }
        });

        if (!otp) {
            resolve({
                status: 404,
                data: {
                    msg: `OTP not found with id: ${otpId}`,
                }
            });
            return
        }

        const currentDate = new Date()
        currentDate.setHours(currentDate.getHours() + 7)

        if (otp.expiredDate < currentDate) {
            resolve({
                status: 410,
                data: {
                    msg: `OTP expired!`,
                }
            });
            return
        }
        const otpMatches = await bcrypt.compare(otpCode, otp.otpCode);
        if (!otpMatches) {
            resolve({
                status: 400,
                data: {
                    msg: `Incorrect OTP!`,
                }
            });
            return
        }
        await db.Otp.update({
            isAllow: true,
        }, {
            where: {
                otpId: otp.otpId
            }
            , individualHooks: true
        })

        resolve({
            status: 200,
            data: {
                msg: `OTP valid`,
            }
        });

    } catch (error) {
        reject(error);
    }
});

const sendOtpToEmail = async (email, userId, fullName, otpType) => {
    try {
        const otpCode = generateRandomOtpCode()
        let user
        if (userId === null || userId === undefined) {
            user = await db.User.findOne({
                where: {
                    email: email
                }
            })
        }

        const resultOtp = await db.Otp.findOne({
            where: {
                otpType: otpType,
                userId: userId ? userId : user.userId
            }
        })

        const htmlContent = generateOtpContent(userId ? fullName : user.userName, otpType, otpCode)
        mailer.sendMail(email, "OTP Code Confirmation", htmlContent)

        let otp
        const currentDate = new Date()
        currentDate.setHours(currentDate.getHours() + 7)
        const newExpiredDate = currentDate.setMinutes(currentDate.getMinutes() + 15)
        if (resultOtp) {
            otp = resultOtp

            await db.Otp.update({
                otpCode: hashOtpCode(otpCode), expiredDate: newExpiredDate, isAllow: false
            }, {
                where: {
                    otpId: resultOtp.otpId
                }, individualHooks: true
            })
        } else {
            const setUpOtp = { otpCode: hashOtpCode(otpCode), otpType: otpType, userId: userId ? userId : user.userId, expiredDate: newExpiredDate }
            otp = await db.Otp.create(setUpOtp)
        }

        return {
            status: 200,
            data: {
                msg: `Otp sent to email: ${email} `,
                otp: { otpId: otp.otpId, otpType: otpType }
            }
        };

    } catch (error) {
        console.error("Error sending OTP:", error);
    }
};

function generateRandomOtpCode() {
    return Math.floor(100000 + Math.random() * 899999).toString()
}

function generateOtpContent(userName, otpType, otpCode) {
    const otpMessage =
        otpType === OTP_TYPE.GET_BOOKING_EMAIL
            ? "We noticed that you requested to view your booking history using this email. Please use the following OTP to confirm that this is you. <br><b>This OTP is valid for 15 minutes</b>.</br>."
            : "We noticed that you requested a tour booking using this email. Please use the following OTP to confirm that this is you. <br><b>This OTP is valid for 15 minutes</b>.</br>"

    return {
        body: {
            name: userName,
            intro: otpMessage,
            action: {
                instructions: '<b>Here is your OTP code:</b>',
                button: {
                    color: 'orange',
                    text: `<b>${otpCode}</b>`,
                    link: ''
                }
            },
            outro: "If you did not request this OTP, no further action is required on your part.",
            signature: 'Sincerely'
        }
    };
}

module.exports = { validateOtp, sendOtpToEmail };