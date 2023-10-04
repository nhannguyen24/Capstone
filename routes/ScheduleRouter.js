const controllers = require('../controllers/ScheduleController');
const express = require('express');
const verifyToken = require('../middlewares/VerifyToken');
const router = express.Router();
const {isAdminOrManager} = require('../middlewares/VerifyRole');

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
 *         date:
 *           type: string
 *           description: The schedule date
 *         startTime:
 *           type: string
 *           description: The schedule departure time
 *         endTime:
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
 *       - name: status
 *         in: query
 *         schema:
 *           type: string
 *           enum: ["Active", "Deactive"]
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
router.get("/", verifyToken, controllers.getAllSchedule);

/**
 * @swagger
 * /api/v1/schedules/{scheduleId}:
 *   get:
 *     security: 
 *         - BearerAuth: []
 *     summary: Returns the the schedules by id
 *     tags: [Schedule]
 *     parameters:
 *       - name: scheduleId
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
 *                 $ref: '#/components/schemas/Station'
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
 *                    busId: 8c382e13-8620-460a-bd95-96b1152c1368 
 *                    tourGuideId: 8c382e13-8620-460a-bd95-96b1152c1368
 *                    driverId: 8c382e13-8620-460a-bd95-96b1152c1368
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
router.post("/", verifyToken, isAdminOrManager, controllers.createSchedule);

/**
 * @swagger
 * /api/v1/schedules:
 *   put:
 *     security: 
 *         - BearerAuth: []
 *     summary: Update the schedule by id
 *     tags: [Schedule]
 *     requestBody:
 *       content:
 *          application/json:
 *            schema:                     
 *                  example:
 *                    scheduleId: 8c382e13-8620-460a-bd95-96b1152c1368
 *                    startTime: 2023-09-23T09:00:00Z
 *                    endTime: 2023-09-23T12:00:00Z
 *                    tourId: 8c382e13-8620-460a-bd95-96b1152c1368 
 *                    busId: 8c382e13-8620-460a-bd95-96b1152c1368 
 *                    tourGuideId: 8c382e13-8620-460a-bd95-96b1152c1368
 *                    driverId: 8c382e13-8620-460a-bd95-96b1152c1368
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
router.put("/", verifyToken, isAdminOrManager, controllers.updateSchedule);

/**
 * @swagger
 * /api/v1/schedules:
 *   delete:
 *     security: 
 *         - BearerAuth: []
 *     summary: Delete the schedules by id
 *     tags: [Schedule]
 *     parameters:
 *       - name: scheduleIds[0]
 *         in: query
 *         schema:
 *           type: string
 *         description: Input scheduleId to delete
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
router.delete("/", verifyToken, isAdminOrManager, controllers.deleteSchedule);

module.exports = router;
