// const controllers = require('../controllers/TrackingController');
// const express = require('express');
// const verifyToken = require('../middlewares/VerifyToken');
// const router = express.Router();
// const { isAdminOrManager } = require('../middlewares/VerifyRole');

// /**
//  * @swagger
//  * components:
//  *   schemas:
//  *     Tracking:
//  *       type: object
//  *       required:
//  *       properties:
//  *         trackingId:
//  *           type: string
//  *           description: The auto-generated id of the tracking
//  *         coordinate:
//  *           type: string
//  *           description: The current coordinate of bus
//  *         tourId:
//  *           type: string
//  *         busId:
//  *           type: string
//  *         status:
//  *           type: string
//  *           description: The tracking status('Active', 'Deactive')
//  */

// /**
//  * @swagger
//  * /api/v1/trackings/coordinates:
//  *   get:
//  *     security: 
//  *         - BearerAuth: []
//  *     summary: Returns the list of all the trackings
//  *     tags: [Tracking]
//  *     parameters:
//  *       - name: tourId
//  *         in: query
//  *         schema:
//  *           type: string
//  *         description: Find tracking by tourId
//  *       - name: busId
//  *         in: query
//  *         schema:
//  *           type: string
//  *         description: Find tracking by busId
//  *       - name: status
//  *         in: query
//  *         schema:
//  *           type: string
//  *           enum: ["Active", "Deactive"]
//  *         description: Find tracking by status
//  *     responses:
//  *       200:
//  *         description: Get the list of the trackings successfully
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: array
//  *               items:
//  *                 $ref: '#/components/schemas/Tracking'
//  */
// router.get("/", verifyToken, controllers.getAllTracking);

// /**
//  * @swagger
//  * /api/v1/trackings/coordinates:
//  *   post:
//  *     security: 
//  *         - BearerAuth: []
//  *     summary: Update the tracking by id
//  *     tags: [Tracking]
//  *     requestBody:
//  *       content:
//  *          application/json:
//  *            schema:
//  *              $ref: '#/components/schemas/Tracking'
//  *            example:
//  *              trackingId: 8c382e13-8620-460a-bd95-96b1152c1368
//  *              tourId: 8c382e13-8620-460a-bd95-96b1152c1368
//  *              latitude: 10.7688046
//  *              longitude: 106.6903351
//  *              status: Active
//  *     responses:
//  *       200:
//  *         description: Update the tracking successfully
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: array
//  *               items:
//  *                 $ref: '#/components/schemas/Tracking'
//  */
// router.post("/", controllers.createTracking);

// module.exports = router;
