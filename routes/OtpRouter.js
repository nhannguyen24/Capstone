const controllers = require('../controllers/OtpController');
const express = require('express');

const router = express.Router();

/**
 * @swagger
 * /api/v1/otp:
 *   get:
 *     summary: OTP validation for get booking by email and booking tour if not logged in
 *     tags: [OTP]
 *     parameters:
 *       - in: query
 *         name: otpId
 *         schema:
 *           type: string
 *         required: true
 *       - in: query
 *         name: otpCode
 *         schema:
 *           type: string
 *           example: 114856
 *         required: true
 *       - in: query
 *         name: otpType
 *         schema:
 *           type: string
 *           enum:
 *              - ChangePassword
 *              - GetBookingEmail
 *              - BookingTour
 *              - CancelBooking
 *              - ForgotPassword
 *         required: true
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
router.get("/", controllers.validateOtp);

/**
 * @swagger
 * /api/v1/otp:
 *   post:
 *     summary: Send OTP with email
 *     tags: [OTP]
 *     parameters:
 *       - in: query
 *         name: email
 *         schema:
 *           type: string
 *         required: true
 *       - in: query
 *         name: otpType
 *         schema:
 *           type: string
 *           enum:
 *              - ChangePassword
 *              - GetBookingEmail
 *              - BookingTour
 *              - CancelBooking
 *              - ForgotPassword
 *         required: true
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
router.post("/", controllers.sendOtpToEmail);

module.exports = router;
