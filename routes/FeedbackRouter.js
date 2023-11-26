const controllers = require('../controllers/FeedbackController');
const express = require('express');
const verifyToken = require('../middlewares/VerifyToken');
const {roleAuthen} = require('../middlewares/VerifyRole');

const router = express.Router();

/**
 * @swagger
 * /api/v1/feedbacks:
 *   get:
 *     summary: Get list feedbacks
 *     tags: [Feedback]
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
 *         name: routeId
 *         schema:
 *           type: string
 *         description: Search feedback by route
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: Search feedback by userId
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
router.get("/", controllers.getFeedbacks);


/**
 * @swagger
 * /api/v1/feedbacks:
 *   post:
 *     security: 
 *         - BearerAuth: []
 *     summary: Create a new feedback
 *     tags: [Feedback]
 *     requestBody:
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                  customerId:
 *                      type: string
 *                  routeId:
 *                      type: string
 *                  stars:
 *                      type: integer
 *                  description:
 *                      type: string
 *            example:
 *              {
 *                  customerId: 6e2aa67d-cf75-430c-9dc5-460fed2fb1e8,
 *                  routeId: 8f4e470b-a673-4d6e-b107-671ef9207d2d,
 *                  stars: 4,
 *                  description: Route này có phong cảnh và các dịa điểm đẹp,
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
router.post("/", verifyToken, roleAuthen(["Customer"]), controllers.createFeedback);

/**
 * @swagger
 * /api/v1/feedbacks/{id}:
 *   get:
 *     security: 
 *         - BearerAuth: []
 *     summary: Get feedback by Id 
 *     tags: [Feedback]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           example: 72102f7f-3b83-47ff-b5c7-ea5e75a20c80
 *         required: true
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
router.get("/:id", verifyToken, roleAuthen(["Manager"]), controllers.getFeedbackById);

/**
 * @swagger
 * /api/v1/feedbacks/{id}:
 *   put:
 *     security: 
 *         - BearerAuth: []
 *     summary: Update feedback by id
 *     tags: [Feedback]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *     requestBody:
 *       description: Bus data to update
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *              type: object
 *              properties: 
 *                  stars: 
 *                      type: integer
 *                  description: 
 *                      type: string
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
router.put("/:id", verifyToken, roleAuthen(["Manager", "Customer"]), controllers.updateFeedback);

/**
 * @swagger
 * /api/v1/feedbacks/{id}:
 *   delete:
 *     security: 
 *         - BearerAuth: []
 *     summary: Delete feedback by id
 *     tags: [Feedback]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           example: 7dc19b05-7f0b-409d-ab57-23cdcf728aa3
 *         required: true
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
 */
router.delete("/:id", verifyToken, roleAuthen(["Manager", "Customer"]), controllers.deleteFeedback);

module.exports = router;
