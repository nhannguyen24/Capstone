const db = require('../models');
const { Op } = require('sequelize');
const OTP_TYPE = require("../enums/OtpTypeEnum")
const mailer = require("../utils/MailerUtil")
const { StatusCodes } = require('http-status-codes');
const bcrypt = require('bcryptjs');
const hashOtpCode = otpCode => bcrypt.hashSync(otpCode, bcrypt.genSaltSync(8));

const validateOtp = async (req) => {
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
            return{
                status: StatusCodes.NOT_FOUND,
                data: {
                    msg: `OTP not found!`,
                }
            }
        }

        const currentDate = new Date()
        currentDate.setHours(currentDate.getHours() + 7)

        if (otp.timeExpired < currentDate) {
            return{
                status: StatusCodes.GONE,
                data: {
                    msg: `OTP expired!`,
                }
            }
        }
        const otpMatches = await bcrypt.compare(otpCode, otp.otpCode);
        if (!otpMatches) {
            return{
                status: StatusCodes.BAD_REQUEST,
                data: {
                    msg: `Incorrect OTP!`,
                }
            }
        }
        await db.Otp.update({
            isAllow: true,
        }, {
            where: {
                otpId: otp.otpId
            }
            , individualHooks: true
        })

        return{
            status: StatusCodes.ACCEPTED,
            data: {
                msg: `OTP validation success`,
            }
        }
    } catch (error) {
        console.error(error);
    }
}

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
        const newTimeExpired = currentDate.setMinutes(currentDate.getMinutes() + 15)
        if (resultOtp) {
            otp = resultOtp
            await db.Otp.update({
                otpCode: hashOtpCode(otpCode), timeExpired: newTimeExpired, isAllow: false
            }, {
                where: {
                    otpId: resultOtp.otpId
                }, individualHooks: true
            })
        } else {
            const setUpOtp = { otpCode: hashOtpCode(otpCode), otpType: otpType, userId: userId ? userId : user.userId, timeExpired: newTimeExpired, otpType: otpType }
            otp = await db.Otp.create(setUpOtp)
        }

        return {
            status: StatusCodes.CREATED,
            data: {
                msg: `Otp required! A new otp sent to email: ${email}`,
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
    let otpMessage;

    switch (otpType) {
        case OTP_TYPE.GET_BOOKING_EMAIL:
            otpMessage =
                "We noticed that you requested to <b>View Your Booking History</b> using this email. Please use the following OTP to confirm that this is you. <br><b>This OTP is valid for 15 minutes</b>.</br>.";
            break;
        case OTP_TYPE.BOOKING_TOUR:
            otpMessage =
                "We noticed that you requested a <b>Tour Booking</b> using this email. Please use the following OTP to confirm that this is you. <br><b>This OTP is valid for 15 minutes</b>.</br>";
            break;
        case OTP_TYPE.CANCEL_BOOKING:
            otpMessage =
                "We noticed that you requested to <b>Cancel Booking</b> using this email. Please use the following OTP to confirm that this is you. <br><b>This OTP is valid for 15 minutes</b>.</br>";
            break;
        case OTP_TYPE.CHANGE_PASSWORD:
            otpMessage =
                "We noticed that you requested to <b>Change Password</b>. Please use the following OTP to confirm that this is you. <br><b>This OTP is valid for 15 minutes</b>.</br>";
            break;
        default:
            otpMessage = "Default message for unknown OTP type.";
    }

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