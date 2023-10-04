const controllers = require('../controllers/ReportController');
const express = require('express');
const verifyToken = require('../middlewares/VerifyToken');
const {isCustomer, isAdminOrManager, isLoggedIn} = require('../middlewares/VerifyRole');

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
 *         name: customerId
 *         schema:
 *           type: string
 * 
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
router.get("/", verifyToken, isLoggedIn, controllers.getReports);

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
router.get("/:id", verifyToken, isLoggedIn, controllers.getReportsById);

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
 *                  customerId:
 *                      type: string
 *                  title:
 *                      type: string
 *                  description:
 *                      type: string
 *            example:
 *              {
 *                  customerId: 224e8a10-4933-486d-8df2-b799905cde83,
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
router.post("/", verifyToken, isLoggedIn, controllers.createReport);

/**
 * @swagger
 * /api/v1/reports/{id}:
 *   put:
 *     security: 
 *         - BearerAuth: []
 *     summary: Update report by id
 *     tags: [Report]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           example: 5fc762ee-0c43-45f6-affa-e4d7e340256d
 *         required: true
 *       - in: query
 *         name: response
 *         schema:
 *           type: string
 *           example: Reponse trả về cho người report khi thay đổi trạng thái report
 *         required: true
 *       - in: query
 *         name: reportStatus
 *         schema:
 *           type: string
 *           enum:  
 *              - Approved
 *              - Pending
 *              - Rejected
 *              - Completed
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
router.put("/:id", verifyToken, isAdminOrManager, controllers.updateReport);

module.exports = router;
