const controllers = require('../controllers/ScheduleController');
const express = require('express');
const verifyToken = require('../middlewares/VerifyToken');
const router = express.Router();
const {roleAuthen} = require('../middlewares/VerifyRole');

/**
 * @swagger
 * components:
 *   schemas:
 *     Schedule:
 *       type: object
 *       required:
 *       properties:
 *         scheduleId:
 *           type: string
 *           description: The auto-generated id of the schedule
 *         startDate:
 *           type: string
 *           description: The schedule departure time
 *         endDate:
 *           type: string
 *           description: The schedule end time
 *         busId:
 *           type: string
 *           description: The bus of schedule
 *         tourId:
 *           type: string
 *           description: The tour of schedule
 *         tourGuideId:
 *           type: string
 *           description: The tour guild of schedule
 *         driverId:
 *           type: string
 *           description: The driver of schedule
 *         scheduleStatus:
 *           type: string
 *           description: The schedule status('Available','Started','Canceled','Finished')
 *         status:
 *           type: string
 *           description: The schedule status('Active', 'Deactive')
 */

/**
 * @swagger
 * /api/v1/schedules:
 *   get:
 *     security: 
 *         - BearerAuth: []
 *     summary: Returns the list of all the schedules
 *     tags: [Schedule]
 *     parameters:
 *       - name: busId
 *         in: query
 *         schema:
 *           type: string
 *         description: Find schedule by busId
 *       - name: tourId
 *         in: query
 *         schema:
 *           type: string
 *         description: Find schedule by tourId
 *       - name: tourGuideId
 *         in: query
 *         schema:
 *           type: string
 *         description: Find schedule by tourGuideId
 *       - name: driverId
 *         in: query
 *         schema:
 *           type: string
 *         description: Find schedule by driverId
 *       - name: scheduleStatus
 *         in: query
 *         schema:
 *           type: string
 *           enum: ["Available", "Started", "Canceled", "Finished"]
 *       - name: status
 *         in: query
 *         schema:
 *           type: string
 *           enum: ["Active", "Deactive"]
 *         description: Find schedule by status
 *       - name: startTime
 *         in: query
 *         schema:
 *           type: string
 *         description: Find schedule by status
 *       - name: endTime
 *         in: query
 *         schema:
 *           type: string
 *         description: Find schedule by status
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
 *         description: Sort by (scheduleName/createdAt)
 *       - name: order[1]
 *         in: query
 *         schema:
 *           type: string
 *         description: Sort ASC/DESC
 *     responses:
 *       200:
 *         description: Get the list of the schedules successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Schedule'
 */
router.get("/", verifyToken, controllers.getAllSchedule)

/**
 * @swagger
 * /api/v1/schedules/transaction:
 *   get:
 *     security: 
 *         - BearerAuth: []
 *     tags: [Schedule]
 *     parameters:
 *       - in: query
 *         name: tourGuideId
 *         schema:
 *           type: string
 *         description: Search by tourGuideId
 *       - in: query
 *         name: isPaidToManager
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
router.get("/transaction", verifyToken, roleAuthen(["Manager", "TourGuide"]), controllers.getScheduleTransactionList)

/**
 * @swagger
 * /api/v1/schedules/transaction/{scheduleId}:
 *   get:
 *     security: 
 *         - BearerAuth: []
 *     summary: Get transactions of tour for paid back to manager
 *     tags: [Schedule]
 *     parameters:
 *       - in: path
 *         name: scheduleId
 *         schema:
 *           type: string
 *         required: true
 * 
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
router.get("/transaction/:scheduleId", verifyToken, roleAuthen(["Manager", "TourGuide"]), controllers.getScheduleTransactionDetail)

/**
 * @swagger
 * /api/v1/schedules/{id}:
 *   get:
 *     security: 
 *         - BearerAuth: []
 *     summary: Returns the the schedules by id
 *     tags: [Schedule]
 *     parameters:
 *       - name: id
 *         in: path
 *         schema:
 *           type: string
 *         description: Find schedule by scheduleId
 *     responses:
 *       200:
 *         description: Get the schedule by id successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Schedule'
 */
router.get("/:id", verifyToken, controllers.getScheduleById);

/**
 * @swagger
 * /api/v1/schedules:
 *   post:
 *     security:
 *       - BearerAuth: []
 *     summary: Create new schedule
 *     tags: [Schedule]
 *     requestBody:
 *       content:
 *          application/json:
 *            schema:                     
 *                  example:
 *                    tourId: 8c382e13-8620-460a-bd95-96b1152c1368
 *                    departureDate: 2024-01-02T09:00:00Z
 *                    departureStationId: a46ac6ed-7d0d-4f02-a9b5-9d9e6f39ff40
 *     responses:
 *       200:
 *         description: Create new schedule successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Schedule'
 */
router.post("/", verifyToken, roleAuthen(["Admin", "Manager"]), controllers.createSchedule);

/**
 * @swagger
 * /api/v1/schedules/{id}:
 *   put:
 *     security: 
 *         - BearerAuth: []
 *     summary: Update the schedule by id
 *     tags: [Schedule]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Update schedule by id
 *     requestBody:
 *       content:
 *          application/json:
 *            schema:                     
 *                  example:
 *                    departureDate: 2024-01-02T08:00:00Z
 *                    departureStationId: a46ac6ed-7d0d-4f02-a9b5-9d9e6f39ff40
 *                    tourId: 8c382e13-8620-460a-bd95-96b1152c1368
 *                    tourGuideId: 8c382e13-8620-460a-bd95-96b1152c1368
 *                    driverId: 8c382e13-8620-460a-bd95-96b1152c1368
 *                    busId: 8c382e13-8620-460a-bd95-96b1152c1368
 *                    scheduleStatus: Started
 *                    status: Active
 *     responses:
 *       200:
 *         description: Update the schedule successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Schedule'
 */
router.put("/:id", verifyToken, roleAuthen(["Admin", "Manager", "TourGuide", "Driver"]), controllers.updateSchedule);

/**
 * @swagger
 * /api/v1/schedules/{id}:
 *   delete:
 *     security: 
 *         - BearerAuth: []
 *     summary: Delete the schedules by id
 *     tags: [Schedule]
 *     parameters:
 *       - name: id
 *         in: path
 *         schema:
 *           type: string
 *         description: Input id to delete
 *     responses:
 *       200:
 *         description: Delete the schedules by id successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Schedule'
 */
router.delete("/:id", verifyToken, roleAuthen(["Admin", "Manager"]), controllers.deleteSchedule);

module.exports = router;
