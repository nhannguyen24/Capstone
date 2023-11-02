const controllers = require('../controllers/PointOfInterestController');
const express = require('express');
const verifyToken = require('../middlewares/VerifyToken');
const router = express.Router();
const {roleAuthen} = require('../middlewares/VerifyRole');

/**
 * @swagger
 * components:
 *   schemas:
 *     PointOfInterest:
 *       type: object
 *       required:
 *       properties:
 *         poiId:
 *           type: string
 *           description: The auto-generated id of the poi
 *         poiName:
 *           type: string
 *           description: The point name
 *         description:
 *           type: string
 *           description: The point description
 *         address:
 *           type: number
 *           description: The point address
 *         latitude:
 *           type: number
 *           description: The point latitude
 *         longitude:
 *           type: number
 *           description: The point longitude
 *         status:
 *           type: string
 *           description: The point status('Active', 'Deactive')
 */

/**
 * @swagger
 * /api/v1/points:
 *   get:
 *     security: 
 *         - BearerAuth: []
 *     summary: Returns the list of all the points
 *     tags: [Point Of Interest]
 *     parameters:
 *       - name: poiName
 *         in: query
 *         schema:
 *           type: string
 *         description: Find point by poiName
 *       - name: address
 *         in: query
 *         schema:
 *           type: string
 *         description: Find point by address
 *       - name: status
 *         in: query
 *         schema:
 *           type: string
 *           enum: ["Active", "Deactive"]
 *         description: Find point by status
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
 *         description: Sort by (poiName/createdAt)
 *       - name: order[1]
 *         in: query
 *         schema:
 *           type: string
 *         description: Sort ASC/DESC
 *     responses:
 *       200:
 *         description: Get the list of the points successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/PointOfInterest'
 */
router.get("/", verifyToken, controllers.getAllPointOfInterest);

/**
 * @swagger
 * /api/v1/points/{id}:
 *   get:
 *     security: 
 *         - BearerAuth: []
 *     summary: Returns the the points by id
 *     tags: [Point Of Interest]
 *     parameters:
 *       - name: id
 *         in: path
 *         schema:
 *           type: string
 *         description: Find point by poiId
 *     responses:
 *       200:
 *         description: Get the point by id successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/PointOfInterest'
 */
router.get("/:id", verifyToken, controllers.getPointOfInterestById);

/**
 * @swagger
 * /api/v1/points:
 *   post:
 *     security:
 *       - BearerAuth: []
 *     summary: Create new point
 *     tags: [Point Of Interest]
 *     requestBody:
 *       content:
 *          application/json:
 *            schema:                     
 *                  example:
 *                    poiName: Trạm xe buýt Công viên 23/9
 *                    description: Một trạm tuyệt vời
 *                    address: 187 Phạm Ngũ Lão
 *                    latitude: 10.7688046
 *                    longitude: 106.6903351
 *                    images:
 *                          - string
 *                          - string
 *     responses:
 *       200:
 *         description: Create new point successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/PointOfInterest'
 */
router.post("/", verifyToken, roleAuthen(["Manager"]), controllers.createPointOfInterest);

/**
 * @swagger
 * /api/v1/points/{id}:
 *   put:
 *     security: 
 *         - BearerAuth: []
 *     summary: Update the point by id
 *     tags: [Point Of Interest]
 *     parameters:
 *       - in: path
 *         name: poiId
 *         schema:
 *           type: string
 *         required: true
 *         description: Update point of interest by poiId
 *     requestBody:
 *       content:
 *          application/json:
 *            schema:                     
 *                  example:
 *                    poiName: Trạm xe buýt Công viên 23/9
 *                    description: Một trạm tuyệt vời
 *                    address: 187 Phạm Ngũ Lão
 *                    latitude: 10.7688046
 *                    longitude: 106.6903351
 *                    images:
 *                          - string
 *                          - string
 *                    status: Active
 *     responses:
 *       200:
 *         description: Update the point successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/PointOfInterest'
 */
router.put("/:id", verifyToken, roleAuthen(["Manager"]), controllers.updatePointOfInterest);

/**
 * @swagger
 * /api/v1/points/{id}:
 *   delete:
 *     security: 
 *         - BearerAuth: []
 *     summary: Delete the pois by id
 *     tags: [Point Of Interest]
 *     parameters:
 *       - name: poiId
 *         in: path
 *         schema:
 *           type: string
 *         description: Input poiId to delete
 *     responses:
 *       200:
 *         description: Delete the points by id successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/PointOfInterest'
 */
router.delete("/:id", verifyToken, roleAuthen(["Manager"]), controllers.deletePointOfInterest);

module.exports = router;
