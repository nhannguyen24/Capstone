const controllers = require('../controllers/PointOfInterestController');
const express = require('express');
const verifyToken = require('../middlewares/VerifyToken');
const router = express.Router();
const {isAdminOrManager} = require('../middlewares/VerifyRole');

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
 *         longtitude:
 *           type: number
 *           description: The point longtitude
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
 *     tags: [point-of-interest-controller]
 *     parameters:
 *       - name: poiName
 *         in: query
 *         schema:
 *           type: string
 *         description: Find point by poiName
 *       - name: poiId
 *         in: query
 *         schema:
 *           type: string
 *         description: Find point by poiId
 *       - name: address
 *         in: query
 *         schema:
 *           type: string
 *         description: Find point by address
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
 *     tags: [point-of-interest-controller]
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
 *                 $ref: '#/components/schemas/Station'
 */
router.get("/:id", verifyToken, controllers.getPointOfInterestById);

/**
 * @swagger
 * /api/v1/points:
 *   post:
 *     security:
 *       - BearerAuth: []
 *     summary: Create new point
 *     tags: [point-of-interest-controller]
 *     requestBody:
 *       content:
 *          application/json:
 *            schema:                     
 *                  example:
 *                    poiName: Trạm xe buýt Công viên 23/9
 *                    description: Một trạm tuyệt vời
 *                    address: 187 Phạm Ngũ Lão
 *                    latitude: 10.7688046
 *                    longtitude: 106.6903351
 *                    images:
 *                          - image: string
 *                          - image: string
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
router.post("/", verifyToken, isAdminOrManager, controllers.createPointOfInterest);

/**
 * @swagger
 * /api/v1/points:
 *   put:
 *     security: 
 *         - BearerAuth: []
 *     summary: Update the point by id
 *     tags: [point-of-interest-controller]
 *     requestBody:
 *       content:
 *          application/json:
 *            schema:                     
 *                  example:
 *                    poiId: 8c382e13-8620-460a-bd95-96b1152c1368
 *                    poiName: Trạm xe buýt Công viên 23/9
 *                    description: Một trạm tuyệt vời
 *                    address: 187 Phạm Ngũ Lão
 *                    latitude: 10.7688046
 *                    longtitude: 106.6903351
 *                    images:
 *                          - image: string
 *                          - image: string
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
router.put("/", verifyToken, isAdminOrManager, controllers.updatePointOfInterest);

/**
 * @swagger
 * /api/v1/points:
 *   delete:
 *     security: 
 *         - BearerAuth: []
 *     summary: Delete the pois by id
 *     tags: [point-of-interest-controller]
 *     parameters:
 *       - name: poiIds[0]
 *         in: query
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
router.delete("/", verifyToken, isAdminOrManager, controllers.deletePointOfInterest);

module.exports = router;
