const controllers = require('../controllers/TrackingController');
const express = require('express');
const verifyToken = require('../middlewares/VerifyToken');
const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Tracking:
 *       type: object
 *       required:
 *       properties:
 *         trackingId:
 *           type: string
 *           description: The auto-generated id of the tracking
 *         coordinate:
 *           type: string
 *           description: The current coordinate of bus
 *         scheduleId:
 *           type: string
 *         busId:
 *           type: string
 *         status:
 *           type: string
 *           description: The tracking status('Active', 'Deactive')
 */

/**
 * @swagger
 * /api/v1/trackings/coordinates:
 *   get:
 *     security: 
 *         - BearerAuth: []
 *     summary: Returns the list of all the trackings
 *     tags: [Tracking]
 *     parameters:
 *       - name: scheduleId
 *         in: query
 *         schema:
 *           type: string
 *         description: Find tracking by scheduleId
 *       - name: busId
 *         in: query
 *         schema:
 *           type: string
 *         description: Find tracking by busId
 *       - name: status
 *         in: query
 *         schema:
 *           type: string
 *           enum: ["Active", "Deactive"]
 *         description: Find tracking by status
 *     responses:
 *       200:
 *         description: Get the list of the trackings successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Tracking'
 */
router.get("/", controllers.getAllTracking);

/**
 * @swagger
 * /api/v1/trackings/coordinates:
 *   post:
 *     security: 
 *         - BearerAuth: []
 *     summary: Create new tracking
 *     tags: [Tracking]
 *     requestBody:
 *       content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/Tracking'
 *            example:
 *              scheduleId: ed1fa858-326b-408b-a2db-0290a6b5373b
 *              latitude: 10.7688046
 *              longitude: 106.6903351
 *     responses:
 *       200:
 *         description: Update the tracking successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Tracking'
 */
router.post("/", controllers.createTracking);

/**
 * @swagger
 * /api/v1/trackings/coordinates/{id}:
 *   put:
 *     security: 
 *         - BearerAuth: []
 *     summary: Update the tracking by id
 *     tags: [Tracking]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Update tracking by id
 *     requestBody:
 *       content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/Tracking'
 *            example:
 *              latitude: 10.7688046
 *              longitude: 106.6903351
 *              status: Active
 *     responses:
 *       200:
 *         description: Update the tracking successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Tracking'
 */
router.put("/:id", controllers.updateTracking);

module.exports = router;
