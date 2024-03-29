const controllers = require('../controllers/PaymentController');
const express = require('express');
const verifyToken = require('../middlewares/VerifyToken');
const {roleAuthen} = require('../middlewares/VerifyRole');
const router = express.Router();

/**
 * @swagger
 * /api/v1/payments/momo:
 *   post:
 *     summary: Pay with Momo
 *     tags: [Payment]
 *     parameters:
 *       - in: query
 *         name: redirect
 *         schema:
 *           type: string
 *           example: https://walletfpt.com
 *         required: true
 *       - in: query
 *         name: amount
 *         schema:
 *           type: string
 *           example: 30000
 *         required: true
 *       - in: query
 *         name: bookingId
 *         schema:
 *           type: string
 *           example: 2233d992-f13f-49b9-a878-80a77e1e2d62
 *         required: true
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
router.post("/momo", controllers.paymentMomo)

/**
 * @swagger
 * /api/v1/payments/pay-os:
 *   post:
 *     summary: Pay with Pay OS
 *     tags: [Payment]
 *     parameters: 
 *       - in: query
 *         name: amount
 *         schema:
 *           type: number
 *           example: 1000
 *         required: true
 *       - in: query
 *         name: cancelUrl
 *         schema:
 *           type: string
 *         required: true
 *       - in: query
 *         name: bookingId
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
router.post("/pay-os", controllers.paymentPayOs)

/**
 * @swagger
 * /api/v1/payments/offline:
 *   put:
 *     summary: Pay booking offline
 *     tags: [Payment]
 *     parameters:
 *       - in: query
 *         name: bookingId
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
router.put("/offline", controllers.paymentOffline);

router.post("/momo-ipn", controllers.getPaymentMomo);


router.get("/pay-os", controllers.getPayOsPaymentResponse);

// /**
//  * @swagger
//  * /api/v1/payments/{id}:
//  *   get:
//  *     summary: Get payment result of payOS
//  *     tags: [Payment]
//  *     parameters:
//  *       - in: query
//  *         name: id
//  *         schema:
//  *           type: string
//  *         required: true
//  *     responses:
//  *       200:
//  *         description: OK
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  */
// router.get("/:id", controllers.getPayOsPaymentResponse);

/**
 * @swagger
 * /api/v1/payments/stripe:
 *   post:
 *     summary: Pay with Stripe
 *     tags: [Payment]
 *     parameters:
 *       - in: query
 *         name: success_url
 *         schema:
 *           type: string
 *           example: https://walletfpt.com
 *       - in: query
 *         name: cancel_url
 *         schema:
 *           type: string
 *           example: https://walletfpt.com
 *       - in: query
 *         name: amount
 *         schema:
 *           type: string
 *           example: 30000
 *         required: true
 *       - in: query
 *         name: bookingId
 *         schema:
 *           type: string
 *           example: 2233d992-f13f-49b9-a878-80a77e1e2d62
 *         required: true
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
router.post("/stripe", controllers.paymentStripe)

/**
 * @swagger
 * /api/v1/payments/schedule-transaction:
 *   put:
 *     security: 
 *         - BearerAuth: []
 *     summary: Update schedule transaction when received money from tour guide
 *     tags: [Payment]
 *     parameters:
 *       - in: query
 *         name: scheduleId
 *         schema:
 *           type: string
 *         required: true
 * 
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
router.put("/schedule-transaction", verifyToken, roleAuthen(["TourGuide"]), controllers.paidScheduleTransaction)

module.exports = router;
