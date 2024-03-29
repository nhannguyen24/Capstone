const controllers = require('../controllers/PriceController');
const express = require('express');
const verifyToken = require('../middlewares/VerifyToken');
const {roleAuthen} = require('../middlewares/VerifyRole');

const router = express.Router();

/**
 * @swagger
 * /api/v1/prices:
 *   get:
 *     security: 
 *         - BearerAuth: []
 *     summary: Get prices 
 *     tags: [Price]
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
 *         name: ticketTypeId
 *         schema:
 *           type: string
 *         description: Filter by ticket type
 * 
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
router.get("/", verifyToken, roleAuthen(["Manager"]), controllers.getPrices);

/**
 * @swagger
 * /api/v1/prices:
 *   post:
 *     security: 
 *         - BearerAuth: []
 *     summary: Create a new price
 *     tags: [Price]
 *     requestBody:
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                  amount:
 *                      type: integer
 *                      minimum: 1000
 *                  ticketTypeId:
 *                      type: string
 *            example:
 *              {
 *                  amount: 150000,
 *                  ticketTypeId: d2dfa0b3-6b26-4a68-a093-05ca5f7f9cc6,
 *              }
 *     responses:
 *       201:
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
router.post("/", verifyToken, roleAuthen(["Manager"]), controllers.createPrice)

/**
 * @swagger
 * /api/v1/prices/{id}:
 *   get:
 *     security: 
 *         - BearerAuth: []
 *     summary: Get price by id
 *     tags: [Price]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           example: 7dc19b05-7f0b-409d-ab57-23cdcf728aa3
 *         required: true
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
router.get("/:id", verifyToken, roleAuthen(["Manager"]), controllers.getPriceById);
// /**
//  * @swagger
//  * /api/v1/prices/{id}/{ticketTypeId}:
//  *   put:
//  *     security: 
//  *         - BearerAuth: []
//  *     summary: Update price by id
//  *     tags: [Price]
//  *     parameters:
//  *       - in: path
//  *         name: id
//  *         schema:
//  *           type: string
//  *         required: true
//  *       - in: path
//  *         name: ticketTypeId
//  *         schema:
//  *           type: string
//  *         required: true
//  *     requestBody:
//  *       description: the day attribute is the price of that day that you want to update the price
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *              type: object
//  *              properties: 
//  *                  amount: 
//  *                      type: integer
//  *     responses:
//  *       200:
//  *         description: OK
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *       400:
//  *         description: Bad request
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  */
// router.put("/:id/:ticketTypeId", verifyToken, roleAuthen(["Manager"]), controllers.updatePrice);

module.exports = router;
