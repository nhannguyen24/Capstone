const controllers = require('../controllers/ReportController');
const express = require('express');
const verifyToken = require('../middlewares/VerifyToken');
const {roleAuthen} = require('../middlewares/VerifyRole');

const router = express.Router();

/**
 * @swagger
 * /api/v1/reports:
 *   get:
 *     security: 
 *         - BearerAuth: []
 *     summary: Get list reports
 *     tags: [Report]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           example: 1
 *         required: true
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           example: 10
 *         required: true
 *         description: Maximum items per page
 *       - in: query
 *         name: reportUserId
 *         schema:
 *           type: string
 *       - in: query
 *         name: tourId
 *         schema:
 *           type: string
 *       - in: query
 *         name: reportStatus
 *         schema:
 *           type: string
 *           enum:
 *              - Approved
 *              - Pending
 *              - Rejected
 * 
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
router.get("/", verifyToken, roleAuthen(["Manager", "Customer", "TourGuide", "Driver"]), controllers.getReports);

/**
 * @swagger
 * /api/v1/reports/{id}:
 *   get:
 *     security: 
 *         - BearerAuth: []
 *     summary: Get report by Id
 *     tags: [Report]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           example: 5fc762ee-0c43-45f6-affa-e4d7e340256d
 *         required: true
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
router.get("/:id", verifyToken, roleAuthen(["Manager", "Customer", "TourGuide", "Driver"]), controllers.getReportsById);

/**
 * @swagger
 * /api/v1/reports:
 *   post:
 *     security: 
 *         - BearerAuth: []
 *     summary: Create a new report
 *     tags: [Report]
 *     requestBody:
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                  reportUserId:
 *                      type: string
 *                  title:
 *                      type: string
 *                  description:
 *                      type: string
 *            example:
 *              {
 *                  reportUserId: ,
 *                  tourId: ,
 *                  title: Viết tiêu đề ngắn gọn,
 *                  description: Mô tả,
 *              }
 *     responses:
 *       201:
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
router.post("/", verifyToken, roleAuthen(["Customer", "TourGuide", "Driver"]), controllers.createReport);

/**
 * @swagger
 * /api/v1/reports/{id}:
 *   put:
 *     security: 
 *         - BearerAuth: []
 *     summary: Manager response to report user
 *     tags: [Report]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *     requestBody:
 *       description: Report data to update
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *              type: object
 *              properties: 
 *                  responseUserId: 
 *                      type: string
 *                  response: 
 *                      type: string
 *                  reportStatus: 
 *                      type: string
 *                      enum:  
 *                          - Approved
 *                          - Rejected
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               type: string
 *       409:
 *         description: Conflict
 *         content:
 *           application/json:
 *             schema:
 *               type: string
 */
router.put("/:id", verifyToken, roleAuthen(["Manager"]), controllers.updateReport);

module.exports = router;
