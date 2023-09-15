const controllers = require('../controllers/PriceController');
const express = require('express');
const verifyToken = require('../middlewares/VerifyToken');
const {isAdminOrManager} = require('../middlewares/VerifyRole');

const router = express.Router();

/**
 * @swagger
 * /api/v1/prices:
 *   get:
 *     security: 
 *         - BearerAuth: []
 *     summary: Get prices 
 *     tags: [Price]
 * 
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
router.get("/", verifyToken, isAdminOrManager, controllers.getAllPrices);

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
 *                  ammount:
 *                      type: integer
 *                      minimum: 1000
 *                  ticketTypeId:
 *                      type: string
 *                  day:
 *                      type: string
 *                      enum:
 *                        - Holiday
 *                        - Weekend
 *                        - Normal
 *            example:
 *              {
 *                  ammount: 150000,
 *                  ticketTypeId: d2dfa0b3-6b26-4a68-a093-05ca5f7f9cc6,
 *                  day: Normal|Weekend|Holiday
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
router.post("/", verifyToken, isAdminOrManager, controllers.createPrice);

/**
 * @swagger
 * /api/v1/prices/{priceId}:
 *   get:
 *     security: 
 *         - BearerAuth: []
 *     summary: Get price by id
 *     tags: [Price]
 *     parameters:
 *       - in: path
 *         name: priceId
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
router.get("/:priceId", verifyToken, isAdminOrManager, controllers.getPriceById);
/**
 * @swagger
 * /api/v1/prices/{priceId}:
 *   put:
 *     security: 
 *         - BearerAuth: []
 *     summary: Update price by id
 *     tags: [Price]
 *     parameters:
 *       - in: path
 *         name: priceId
 *         schema:
 *           type: string
 *           example: 7dc19b05-7f0b-409d-ab57-23cdcf728aa3
 *         required: true
 *       - in: query
 *         name: ammount
 *         schema:
 *           type: integer
 *           example: 200000
 *           minimum: 1000
 *       - in: query
 *         name: ticketTypeId
 *         schema:
 *           type: string
 *           example: 7dc19b05-7f0b-409d-ab57-23cdcf728aa3
 *       - in: query
 *         name: day
 *         schema:
 *           type: string
 *           enum:
 *              - Holiday
 *              - Weekend
 *              - Normal
 *        
 *     responses:
 *       200:
 *         description: OK
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
router.put("/:priceId", verifyToken, isAdminOrManager, controllers.updatePrice);

/**
 * @swagger
 * /api/v1/prices/{priceId}:
 *   delete:
 *     security: 
 *         - BearerAuth: []
 *     summary: Delete price by id
 *     tags: [Price]
 *     parameters:
 *       - in: path
 *         name: priceId
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
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
router.delete("/:priceId", verifyToken, isAdminOrManager, controllers.deletePrice);

module.exports = router;