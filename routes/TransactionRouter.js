const controllers = require('../controllers/TransactionController');
const express = require('express');
const verifyToken = require('../middlewares/VerifyToken');
const { roleAuthen } = require('../middlewares/VerifyRole');

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
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           example: 1
 *         required: true
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           example: 10
 *         required: true
 *         description: Maximum items per page
 *       - in: query
 *         name: bookingId
 *         schema:
 *           type: string
 *         description: Search by bookingId
 *       - in: query
 *         name: transactionCode
 *         schema:
 *           type: string
 *         description: Search by transaction code
 *       - in: query
 *         name: transactionType
 *         schema:
 *           type: string       
 *           enum: 
 *              - MOMO
 *              - Cash
 *              - PAY-OS
 *         description: Search by transaction type
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum:
 *              - DRAFT
 *              - PAID
 *              - REFUNDED
 *         description: Filter by status
 * 
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
router.get("/", verifyToken, roleAuthen(["Manager", "Customer"]), controllers.getTransactions);

/**
 * @swagger
 * /api/v1/transactions/{id}:
 *   get:
 *     security: 
 *         - BearerAuth: []
 *     summary: Get transaction detail by Id
 *     tags: [Transaction]
 *     parameters:
 *       - in: path
 *         name: id
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
router.get("/:id", verifyToken, roleAuthen(["Manager", "Customer"]), controllers.getTransactionById);


module.exports = router;
