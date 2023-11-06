const controllers = require('../controllers/TourController');
const express = require('express');
const verifyToken = require('../middlewares/VerifyToken');
const router = express.Router();
const {roleAuthen} = require('../middlewares/VerifyRole');
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
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
 *       - name: routeId
 *         in: query
 *         schema:
 *           type: string
 *         description: Find tour by routeId
 *       - name: tourGuideId
 *         in: query
 *         schema:
 *           type: string
 *         description: Find tour by tourGuideId
 *       - name: driverId
 *         in: query
 *         schema:
 *           type: string
 *         description: Find tour by driverId
 *       - name: departureDate
 *         in: query
 *         schema:
 *           type: string
 *         description: Find tour by departure date (2023-11-10)
 *       - name: endDate
 *         in: query
 *         schema:
 *           type: string
 *         description: Find tour by end date (2023-11-10)
 *       - name: tourStatus
 *         in: query
 *         schema:
 *           type: string
 *           enum: ["Available", "Started", "Canceled", "Finished"]
 *         description: Find tour by tour status
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
router.get("/", controllers.getAllTour);

/**
 * @swagger
 * /api/v1/tours/{id}:
 *   get:
 *     security: 
 *         - BearerAuth: []
 *     summary: Returns the tours by id
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
 *                 $ref: '#/components/schemas/Tour'
 */
router.get("/:id", controllers.getTourById);

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
 *                          - 3355c24a-741c-4e3b-9d2a-fa43c4c950c5
 *                          - 99f73c58-7c81-4152-90f9-21e50637e9c8
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
router.post("/", verifyToken, roleAuthen(["Admin", "Manager"]), controllers.createTour);

/**
 * @swagger
 * /api/v1/tours/upload:
 *   post:
 *     security:
 *       - BearerAuth: []
 *     summary: Create new tour by excel
 *     tags: [Tour]
 *     requestBody:
 *          required: true
 *          content:
 *            multipart/form-data:
 *              schema:
 *                type: object
 *                properties:
 *                  file:
 *                    type: string
 *                    format: binary
 *     responses:
 *       201:
 *         description: CREATED
 *         content:
 *           multipart/form-data:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Tour'
 */
router.post("/upload", upload.single('file'), verifyToken, roleAuthen(["Manager"]), controllers.createTourByFile);

/**
 * @swagger
 * /api/v1/tours/{id}:
 *   put:
 *     security: 
 *         - BearerAuth: []
 *     summary: Update the tour by id
 *     tags: [Tour]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Update tour by id
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
 *                    busId: 8c382e13-8620-460a-bd95-96b1152c1368
 *                    tourGuideId: 8c382e13-8620-460a-bd95-96b1152c1368
 *                    driverId: 8c382e13-8620-460a-bd95-96b1152c1368
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
router.put("/:id", verifyToken, roleAuthen(["Manager", "TourGuide", "Driver"]), controllers.updateTour);

/**
 * @swagger
 * /api/v1/tours/assigned-tours:
 *   put:
 *     security: 
 *         - BearerAuth: []
 *     summary: Assign employee to tour
 *     tags: [Tour]
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
router.put("/assigned-tours", verifyToken, roleAuthen(["Manager"]), controllers.assignTour);

/**
 * @swagger
 * /api/v1/tours/{id}:
 *   delete:
 *     security: 
 *         - BearerAuth: []
 *     summary: Delete the tours by id
 *     tags: [Tour]
 *     parameters:
 *       - name: id
 *         in: path
 *         schema:
 *           type: string
 *         description: Input id to delete
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
router.delete("/:id", verifyToken, roleAuthen(["Manager"]), controllers.deleteTour);

/**
 * @swagger
 * /api/v1/tours/clone/{id}:
 *   post:
 *     security: 
 *         - BearerAuth: []
 *     summary: Clone new the tours by id
 *     tags: [Tour]
 *     parameters:
 *       - name: id
 *         in: path
 *         schema:
 *           type: string
 *         description: Find tour by id
 *     requestBody:
 *       content:
 *          application/json:
 *            schema:                     
 *                  example:
 *                    tourName: Chuyến đi tham quan buổi sáng
 *                    beginBookingDate: 2023-09-21T00:00:00Z
 *                    endBookingDate: 2023-09-22T00:00:00Z
 *                    departureDate: 2023-09-23T09:00:00Z
 *                    duration: 03:00:00
 *     responses:
 *       200:
 *         description: Clone new tour successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Tour'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               type: string
 *       404:
 *         description: Not Found
 *         content:
 *           application/json:
 *             schema:
 *               type: string 
 */
router.post("/clone/:id", controllers.cloneTour);

module.exports = router;
