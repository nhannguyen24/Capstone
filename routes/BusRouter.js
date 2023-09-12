const controllers = require('../controllers/BusController');
const express = require('express');
const verifyToken = require('../middlewares/VerifyToken');
const {isAdmin} = require('../middlewares/VerifyRole');

const router = express.Router();

/**
 * @swagger
 * /api/v1/buses:
 *   get:
 *     security: 
 *         - BearerAuth: []
 *     summary: Get buses by bus plate
 *     tags: [bus-controller]
 *     parameters:
 *       - in: query
 *         name: busPlate
 *         schema:
 *           type: string
 *         example: 51B
 * 
 *     responses:
 *       200:
 *         description: Get the list of the buses successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 */
router.get("/", verifyToken, isAdmin, controllers.getBusByPlate);


/**
 * @swagger
 * /api/v1/buses:
 *   post:
 *     security: 
 *         - BearerAuth: []
 *     summary: Create a new bus
 *     tags: [bus-controller]
 *     requestBody:
 *        required: true
 *        description: Create Bus
 *        content:
 *          application/json: 
 *            schema:
 *              properties:
 *                  busPlate: 
 *                      type: string
 *                  numberSeat: 
 *                      type: integer
 *            example: 
 *               {
 *                  busPlate: "52B-512.84",
 *                  numberSeat: 30
 *                } 
 *     responses:
 *       201:
 *         description: Create bus successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 */
router.post("/", verifyToken, isAdmin, controllers.createBus);

/**
 * @swagger
 * /api/v1/buses/{busId}:
 *   put:
 *     security: 
 *         - BearerAuth: []
 *     summary: Update bus with id
 *     tags: [bus-controller]
 *     parameters:
 *       - in: path
 *         name: busId
 *         schema:
 *           type: string
 *         required: true
 *         example: 7dc19b05-7f0b-409d-ab57-23cdcf728aa3
 *       - in: query
 *         name: busPlate
 *         schema:
 *           type: string
 *         example: 51B
 *       - in: query
 *         name: numberSeat
 *         schema:
 *           type: integer
 *         example: 30
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum:
 *              - Active
 *              - Deactive
 *     responses:
 *       200:
 *         description: Update bus successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
router.put("/:busId", verifyToken, isAdmin, controllers.updateBus);

module.exports = router;
