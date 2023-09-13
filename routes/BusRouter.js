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
 *           example: 79B
 * 
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
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
 *         name: busCateId
 *         schema:
 *           type: string
 *           example: 79973808-e97f-4487-9677-3cc0d57248a2
 *         required: true
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
router.post("/", verifyToken, isAdmin, controllers.createBus);

/**
 * @swagger
 * /api/v1/buses/{busId}:
 *   put:
 *     security: 
 *         - BearerAuth: []
 *     summary: Update bus by id
 *     tags: [bus-controller]
 *     parameters:
 *       - in: path
 *         name: busId
 *         schema:
 *           type: string
 *           example: 7dc19b05-7f0b-409d-ab57-23cdcf728aa3
 *         required: true
 *       - in: query
 *         name: busPlate
 *         schema:
 *           type: string
 *           example: 79B.514-01
 *       - in: query
 *         name: numberSeat
 *         schema:
 *           type: integer
 *           example: 30
 *       - in: query
 *         name: busCateId
 *         schema:
 *           type: string
 *           example: 79973808-e97f-4487-9677-3cc0d57248a2
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum:
 *              - Active
 *              - Deactive
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
router.put("/:busId", verifyToken, isAdmin, controllers.updateBus);

/**
 * @swagger
 * /api/v1/buses/{busId}:
 *   delete:
 *     security: 
 *         - BearerAuth: []
 *     summary: Update bus status by id
 *     tags: [bus-controller]
 *     parameters:
 *       - in: path
 *         name: busId
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
router.delete("/:busId", verifyToken, isAdmin, controllers.deleteBus);

module.exports = router;
