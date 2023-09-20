const controllers = require('../controllers/StationController');
const express = require('express');
const verifyToken = require('../middlewares/VerifyToken');
const router = express.Router();
const {isAdminOrManager} = require('../middlewares/VerifyRole');

/**
 * @swagger
 * components:
 *   schemas:
 *     Station:
 *       type: object
 *       required:
 *       properties:
 *         stationId:
 *           type: string
 *           description: The auto-generated id of the station
 *         stationName:
 *           type: string
 *           description: The station name
 *         description:
 *           type: string
 *           description: The station description
 *         address:
 *           type: number
 *           description: The station address
 *         latitude:
 *           type: number
 *           description: The station latitude
 *         longitude:
 *           type: number
 *           description: The station longitude
 *         status:
 *           type: string
 *           description: The station status('Active', 'Deactive')
 */

/**
 * @swagger
 * /api/v1/stations:
 *   get:
 *     security: 
 *         - BearerAuth: []
 *     summary: Returns the list of all the stations
 *     tags: [Station]
 *     parameters:
 *       - name: stationName
 *         in: query
 *         schema:
 *           type: string
 *         description: Find station by stationName
 *       - name: address
 *         in: query
 *         schema:
 *           type: string
 *         description: Find station by address
 *       - name: status
 *         in: query
 *         schema:
 *           type: string
 *           enum: ["Active", "Deactive"]
 *         description: Find station by status
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
 *         description: Sort by (stationName/createdAt)
 *       - name: order[1]
 *         in: query
 *         schema:
 *           type: string
 *         description: Sort ASC/DESC
 *     responses:
 *       200:
 *         description: Get the list of the stations successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Station'
 */
router.get("/", verifyToken, controllers.getAllStation);

/**
 * @swagger
 * /api/v1/stations/{id}:
 *   get:
 *     security: 
 *         - BearerAuth: []
 *     summary: Returns the the stations by id
 *     tags: [Station]
 *     parameters:
 *       - name: id
 *         in: path
 *         schema:
 *           type: string
 *         description: Find station by stationId
 *     responses:
 *       200:
 *         description: Get the station by id successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Station'
 */
router.get("/:id", verifyToken, controllers.getStationById);

/**
 * @swagger
 * /api/v1/stations:
 *   post:
 *     security:
 *       - BearerAuth: []
 *     summary: Create new station
 *     tags: [Station]
 *     requestBody:
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/Station'
 *            example:
 *              stationName: Trạm xe buýt Công viên 23/9
 *              description: Một trạm tuyệt vời
 *              address: 187 Phạm Ngũ Lão
 *              latitude: 10.7688046
 *              longitude: 106.6903351
 *     responses:
 *       200:
 *         description: Create new station successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Station'
 */
router.post("/", verifyToken, isAdminOrManager, controllers.createStation);

/**
 * @swagger
 * /api/v1/stations:
 *   put:
 *     security: 
 *         - BearerAuth: []
 *     summary: Update the station by id
 *     tags: [Station]
 *     requestBody:
 *       content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/Station'
 *            example:
 *              stationId: 8c382e13-8620-460a-bd95-96b1152c1368
 *              stationName: Trạm xe buýt Công viên 23/9
 *              description: Một trạm tuyệt vời
 *              address: 187 Phạm Ngũ Lão
 *              latitude: 10.7688046
 *              longitude: 106.6903351
 *              status: Active
 *     responses:
 *       200:
 *         description: Update the station successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Station'
 */
router.put("/", verifyToken, isAdminOrManager, controllers.updateStation);

/**
 * @swagger
 * /api/v1/stations:
 *   delete:
 *     security: 
 *         - BearerAuth: []
 *     summary: Delete the stations by id
 *     tags: [Station]
 *     parameters:
 *       - name: stationIds[0]
 *         in: query
 *         schema:
 *           type: string
 *         description: Input stationId to delete
 *     responses:
 *       200:
 *         description: Delete the stations by id successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Station'
 */
router.delete("/", verifyToken, isAdminOrManager, controllers.deleteStation);

module.exports = router;
