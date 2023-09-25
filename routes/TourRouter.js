const controllers = require('../controllers/TourController');
const express = require('express');
const verifyToken = require('../middlewares/VerifyToken');
const router = express.Router();
const {isAdminOrManager} = require('../middlewares/VerifyRole');

/**
 * @swagger
 * components:
 *   schemas:
 *     Tour:
 *       type: object
 *       required:
 *       properties:
 *         tourId:
 *           type: string
 *           description: The auto-generated id of the tour
 *         tourName:
 *           type: string
 *           description: The tour name
 *         description:
 *           type: string
 *           description: The tour description
 *         beginBookingDate:
 *           type: string
 *           description: The tour begin booking date
 *         endBookingDate:
 *           type: string
 *           description: The tour end booking date
 *         departureDate:
 *           type: string
 *           description: The tour departure date
 *         departureTime:
 *           type: string
 *           description: The tour departure time
 *         endTime:
 *           type: string
 *           description: The tour end time
 *         departureStationId:
 *           type: string
 *           description: The departure station of tour
 *         routeId:
 *           type: string
 *           description: The route of tour
 *         tourStatus:
 *           type: string
 *           description: The tour status('NotStarted','Ontour','Canceled','Finished')
 *         status:
 *           type: string
 *           description: The tour status('Active', 'Deactive')
 */

/**
 * @swagger
 * /api/v1/tours:
 *   get:
 *     security: 
 *         - BearerAuth: []
 *     summary: Returns the list of all the tours
 *     tags: [Tour]
 *     parameters:
 *       - name: tourName
 *         in: query
 *         schema:
 *           type: string
 *         description: Find tour by tourName
 *       - name: tourStatus
 *         in: query
 *         schema:
 *           type: string
 *           enum: ["NotStarted", "Ontour", "Canceled", "Finished"]
 *         description: Find tour by address
 *       - name: status
 *         in: query
 *         schema:
 *           type: string
 *           enum: ["Active", "Deactive"]
 *         description: Find tour by status
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
 *         description: Sort by (tourName/createdAt)
 *       - name: order[1]
 *         in: query
 *         schema:
 *           type: string
 *         description: Sort ASC/DESC
 *     responses:
 *       200:
 *         description: Get the list of the tours successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Tour'
 */
router.get("/", verifyToken, controllers.getAllTour);

/**
 * @swagger
 * /api/v1/tours/{id}:
 *   get:
 *     security: 
 *         - BearerAuth: []
 *     summary: Returns the the tours by id
 *     tags: [Tour]
 *     parameters:
 *       - name: id
 *         in: path
 *         schema:
 *           type: string
 *         description: Find tour by tourId
 *     responses:
 *       200:
 *         description: Get the tour by id successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Station'
 */
router.get("/:id", verifyToken, controllers.getTourById);

/**
 * @swagger
 * /api/v1/tours:
 *   post:
 *     security:
 *       - BearerAuth: []
 *     summary: Create new tour
 *     tags: [Tour]
 *     requestBody:
 *       content:
 *          application/json:
 *            schema:                     
 *                  example:
 *                    tourName: Chuyến đi tham quan buổi sáng
 *                    description: Một chuyến đi tuyệt vời
 *                    beginBookingDate: 2023-09-21T00:00:00Z
 *                    endBookingDate: 2023-09-22T00:00:00Z
 *                    departureDate: 2023-09-23T09:00:00Z
 *                    duration: 03:00:00
 *                    routeId: 8c382e13-8620-460a-bd95-96b1152c1368
 *                    tickets:
 *                          - ticketTypeId
 *                          - ticketTypeId
 *                    images:
 *                          - string
 *                          - string
 *     responses:
 *       200:
 *         description: Create new tour successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Tour'
 */
router.post("/", verifyToken, isAdminOrManager, controllers.createTour);

/**
 * @swagger
 * /api/v1/tours:
 *   put:
 *     security: 
 *         - BearerAuth: []
 *     summary: Update the tour by id
 *     tags: [Tour]
 *     requestBody:
 *       content:
 *          application/json:
 *            schema:                     
 *                  example:
 *                    tourId: 8c382e13-8620-460a-bd95-96b1152c1368
 *                    tourName: Chuyến đi tham quan buổi sáng
 *                    description: Một chuyến đi tuyệt vời
 *                    beginBookingDate: 2023-09-21T00:00:00Z
 *                    endBookingDate: 2023-09-22T00:00:00Z
 *                    departureDate: 2023-09-23T09:00:00Z
 *                    duration: 03:00:00
 *                    routeId: 8c382e13-8620-460a-bd95-96b1152c1368
 *                    tourStatus: Ontour
 *                    status: Active
 *                    images:
 *                          - string
 *                          - string
 *     responses:
 *       200:
 *         description: Update the tour successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Tour'
 */
router.put("/", verifyToken, isAdminOrManager, controllers.updateTour);

/**
 * @swagger
 * /api/v1/tours:
 *   delete:
 *     security: 
 *         - BearerAuth: []
 *     summary: Delete the tours by id
 *     tags: [Tour]
 *     parameters:
 *       - name: tourIds[0]
 *         in: query
 *         schema:
 *           type: string
 *         description: Input tourId to delete
 *     responses:
 *       200:
 *         description: Delete the tours by id successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Tour'
 */
router.delete("/", verifyToken, isAdminOrManager, controllers.deleteTour);

module.exports = router;
