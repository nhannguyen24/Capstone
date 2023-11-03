const controllers = require('../controllers/PaymentController');
const express = require('express');

const router = express.Router();

/**
 * @swagger
 * /api/v1/payments:
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
router.post("/", controllers.paymentMomo);

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

module.exports = router;
