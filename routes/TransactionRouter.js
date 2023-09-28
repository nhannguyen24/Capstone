const controllers = require('../controllers/TransactionController');
const express = require('express');
const verifyToken = require('../middlewares/VerifyToken');
const { isAdminOrManager, isLoggedIn} = require('../middlewares/VerifyRole');

const router = express.Router();

/**
 * @swagger
 * /api/v1/transactions:
 *   get:
 *     security: 
 *         - BearerAuth: []
 *     summary: Get list transactions
 *     description: Get list transaction for admin or with customerId for customer
 *     tags: [Transaction]
 *     parameters:
 *       - in: path
 *         name: customerId
 *         schema:
 *           type: string
 *           example: 7dc19b05-7f0b-409d-ab57-23cdcf728aa3
 * 
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
router.get("/", verifyToken, isAdminOrManager, controllers.getTransactions);

/**
 * @swagger
 * /api/v1/transactions/{transactionId}:
 *   get:
 *     security: 
 *         - BearerAuth: []
 *     summary: Get transaction detail by Id
 *     tags: [Transaction]
 *     parameters:
 *       - in: path
 *         name: transactionId
 *         schema:
 *           type: string
 *           example: 7dc19b05-7f0b-409d-ab57-23cdcf728aa3
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
router.get("/", verifyToken, isLoggedIn, controllers.getTransactionById);


module.exports = router;
