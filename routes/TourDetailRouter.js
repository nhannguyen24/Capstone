const controllers = require('../controllers/TourDetailController');
const express = require('express');
const verifyToken = require('../middlewares/VerifyToken');
const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     TourDetail:
 *       type: object
 *       required:
 *       properties:
 *         tourDetailId:
 *           type: string
 *           description: The auto-generated id of the tourDetail
 *         tourId:
 *           type: string
 *           description: The detail of tour
 *         stationId:
 *           type: string
 *           description: The detail of station
 *         status:
 *           type: string
 *           description: The tourDetail status("Active", "NotArrived", "Arrived", "Deactive")
 */

/**
 * @swagger
 * /api/v1/trackings/stations:
 *   get:
 *     security: 
 *         - BearerAuth: []
 *     summary: Returns the list of all the tourDetails
 *     tags: [Tracking]
 *     parameters:
 *       - name: tourId
 *         in: query
 *         schema:
 *           type: string
 *         description: Find tourDetail by tourId
 *       - name: status
 *         in: query
 *         schema:
 *           type: string
 *           enum: ["Active", "NotArrived", "Arrived", "Deactive"]
 *         description: Find tourDetail by status
 *       - name: page
 *         in: query
 *         schema:
 *           type: int
 *         description: Paging page number
 *       - name: limit
 *         in: query
 *         schema:
 *           type: int
 *         description: Paging limit row to get in 1 page
 *       - name: order[0]
 *         in: query
 *         schema:
 *           type: string
 *         description: Sort by (tourDetailName/createdAt)
 *       - name: order[1]
 *         in: query
 *         schema:
 *           type: string
 *         description: Sort ASC/DESC
 *     responses:
 *       200:
 *         description: Get the list of the tourDetails successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/TourDetail'
 */
router.get("/", controllers.getAllTourDetail);

/**
 * @swagger
 * /api/v1/trackings/stations/{id}:
 *   put:
 *     security: 
 *         - BearerAuth: []
 *     summary: Update the tourDetail by id
 *     tags: [Tracking]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Update tour detail by id
 *     requestBody:
 *       content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/TourDetail'
 *            example:
 *              status: Active
 *     responses:
 *       200:
 *         description: Update the tourDetail successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/TourDetail'
 */
router.put("/:id", controllers.updateTourDetail);

module.exports = router;
