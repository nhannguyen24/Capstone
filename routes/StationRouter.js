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
 *         longtitude:
 *           type: number
 *           description: The station longtitude
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
 *     tags: [station-controller]
 *     parameters:
 *       - name: stationName
 *         in: query
 *         schema:
 *           type: string
 *         description: Find station by stationName
 *       - name: stationId
 *         in: query
 *         schema:
 *           type: string
 *         description: Find station by stationId
 *       - name: address
 *         in: query
 *         schema:
 *           type: string
 *         description: Find station by address
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
 * /api/v1/stations:
 *   post:
 *     security:
 *       - BearerAuth: []
 *     summary: Create new station
 *     tags: [station-controller]
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
 *              longtitude: 106.6903351
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
 *     tags: [station-controller]
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
 *              longtitude: 106.6903351
 *              status: Active
 *     responses:
 *       200:
 *         description: For update the station
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
 * /api/v1/stations/delete:
 *   delete:
 *     security: 
 *         - BearerAuth: []
 *     summary: Delete the stations by id
 *     tags: [station-controller]
 *     parameters:
 *       - name: stationIds[0]
 *         in: query
 *         schema:
 *           type: string
 *         description: Input stationId to delete
 *     responses:
 *       200:
 *         description: Delete the stations by id
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Station'
 */
router.delete("/delete", verifyToken, isAdminOrManager, controllers.deleteStation);

module.exports = router;
