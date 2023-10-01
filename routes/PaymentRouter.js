const controllers = require('../controllers/PaymentController');
const express = require('express');
const verifyToken = require('../middlewares/VerifyToken');
const {isCustomer} = require('../middlewares/VerifyRole');

const router = express.Router();

/**
 * @swagger
 * /api/v1/payments:
 *   post:
 *     summary: Pay with Momo
 *     tags: [Payment]
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
router.post("/", controllers.paymentMomo);

module.exports = router;
