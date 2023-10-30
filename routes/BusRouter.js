const controllers = require('../controllers/BusController');
const express = require('express');
const verifyToken = require('../middlewares/VerifyToken');
const {isAdminOrManager} = require('../middlewares/VerifyRole');

const router = express.Router();

/**
 * @swagger
 * /api/v1/buses:
 *   get:
 *     security: 
 *         - BearerAuth: []
 *     summary: Get buses
 *     tags: [Bus]
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
 *         name: busPlate
 *         schema:
 *           type: string
 *         description: Search by bus plate
 *       - in: query
 *         name: isDoubleDecker
 *         schema:
 *           type: boolean
 *         description: Filter bus double decker
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum:
 *              - Active
 *              - Deactive
 *         description: Filter bus status
 * 
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
router.get("/", verifyToken, isAdminOrManager, controllers.getBuses);


/**
 * @swagger
 * /api/v1/buses:
 *   post:
 *     security: 
 *         - BearerAuth: []
 *     summary: Create a new bus
 *     tags: [Bus]
 *     parameters:
 *       - in: query
 *         name: busPlate
 *         schema:
 *           type: string
 *           example: 51B-217.91
 *         required: true
 *       - in: query
 *         name: numberSeat
 *         schema:
 *           type: integer
 *           example: 30
 *         required: true
 *       - in: query
 *         name: isDoubleDecker
 *         schema:
 *           type: boolean
 *           example: true
 *         required: true
 *       - in: query
 *         name: image
 *         schema:
 *           type: string
 *           example: string
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
router.post("/", verifyToken, isAdminOrManager, controllers.createBus);

/**
 * @swagger
 * /api/v1/buses/{id}:
 *   get:
 *     security: 
 *         - BearerAuth: []
 *     summary: Get bus by id
 *     tags: [Bus]
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
router.get("/:id", verifyToken, isAdminOrManager, controllers.getBusById);

/**
 * @swagger
 * /api/v1/buses/{id}:
 *   put:
 *     security: 
 *         - BearerAuth: []
 *     summary: Update bus by id
 *     tags: [Bus]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *     requestBody:
 *       description: Bus data to update
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *              type: object
 *              properties: 
 *                  busPlate: 
 *                      type: string
 *                  numberSeat: 
 *                      type: integer
 *                  isDoubleDecker: 
 *                      type: boolean
 *                  status: 
 *                      type: string
 *                      enum: 
 *                          - Active
 *                          - Deactive
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
 *               type: string
 *       409:
 *         description: Conflict
 *         content:
 *           application/json:
 *             schema:
 *               type: string
 */
router.put("/:id", verifyToken, isAdminOrManager, controllers.updateBus);

/**
 * @swagger
 * /api/v1/buses/{id}:
 *   delete:
 *     security: 
 *         - BearerAuth: []
 *     summary: Delete bus by id
 *     tags: [Bus]
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
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               type: string
 *       409:
 *         description: Conflict
 *         content:
 *           application/json:
 *             schema:
 *               type: string
 */
router.delete("/:id", verifyToken, isAdminOrManager, controllers.deleteBus);

module.exports = router;
