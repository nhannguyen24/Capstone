const controllers = require('../controllers/PaymentController');
const express = require('express');
const verifyToken = require('../middlewares/VerifyToken');
const {isCustomer} = require('../middlewares/VerifyRole');

const router = express.Router();

/**
 * @swagger
 * /api/v1/payments:
 *   post:
 *     security: 
 *         - BearerAuth: []
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
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
router.post("/", verifyToken, controllers.paymentMomo);


router.post("/momo-ipn", controllers.getPaymentMomo);

module.exports = router;
