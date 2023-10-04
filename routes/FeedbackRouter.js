// const controllers = require('../controllers/FeedbackController');
// const express = require('express');
// const verifyToken = require('../middlewares/VerifyToken');
// const {isCustomer, isAdminOrManager, isLoggedIn} = require('../middlewares/VerifyRole');

// const router = express.Router();

// /**
//  * @swagger
//  * /api/v1/feedbacks:
//  *   get:
//  *     security: 
//  *         - BearerAuth: []
//  *     summary: Get list feedbacks
//  *     tags: [Feedback]
//  * 
//  *     responses:
//  *       200:
//  *         description: OK
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  */
// router.get("/", verifyToken, isAdminOrManager, controllers.getFeedbacks);


// /**
//  * @swagger
//  * /api/v1/feedbacks:
//  *   post:
//  *     security: 
//  *         - BearerAuth: []
//  *     summary: Create a new feedback
//  *     tags: [Feedback]
//  *     requestBody:
//  *        required: true
//  *        content:
//  *          application/json:
//  *            schema:
//  *              type: object
//  *              properties:
//  *                  customerId:
//  *                      type: string
//  *                  tourId:
//  *                      type: string
//  *                  stars:
//  *                      type: float
//  *                      min: 1.0
//  *                      max: 5.0
//  *                  description:
//  *                      type: string
//  *            example:
//  *              {
//  *                  customerId: 224e8a10-4933-486d-8df2-b799905cde83,
//  *                  tourId: 72102f7f-3b83-47ff-b5c7-ea5e75a20c80,
//  *                  stars: 4.0,
//  *                  description: Tour này có phong cảnh và các dịa điểm đẹp cũng như anh hướng dẫn viên rất nhiệt tình và dễ thương,
//  *              }
//  *     responses:
//  *       201:
//  *         description: Created
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *       400:
//  *         description: Bad request
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  */
// router.post("/", verifyToken, isCustomer, controllers.createFeedback);

// /**
//  * @swagger
//  * /api/v1/feedbacks/{tourId}:
//  *   get:
//  *     summary: Get feedback by tourId
//  *     tags: [Feedback]
//  *     parameters:
//  *       - in: path
//  *         name: tourId
//  *         schema:
//  *           type: string
//  *           example: 72102f7f-3b83-47ff-b5c7-ea5e75a20c80
//  *         required: true
//  *     responses:
//  *       200:
//  *         description: OK
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  */
// router.get("/:tourId", controllers.getFeedbacksByTourId);

// /**
//  * @swagger
//  * /api/v1/feedbacks/{feedbackId}:
//  *   put:
//  *     security: 
//  *         - BearerAuth: []
//  *     summary: Update feedback by id
//  *     tags: [Feedback]
//  *     parameters:
//  *       - in: path
//  *         name: feedbackId
//  *         schema:
//  *           type: string
//  *           example: 7dc19b05-7f0b-409d-ab57-23cdcf728aa3
//  *         required: true
//  *       - in: query
//  *         name: star
//  *         schema:
//  *           type: float
//  *           min: 1.0
//  *           max: 5.0
//  *           example: 2.5
//  *       - in: query
//  *         name: description
//  *         schema:
//  *           type: string
//  *           example: Đang tour thì xe hư giữa đường
//  *       - in: query
//  *         name: status
//  *         schema:
//  *           type: string
//  *           enum: 
//  *              - Active   
//  *              - Deactive
//  *           example: Đang tour thì xe hư giữa đường
//  *     responses:
//  *       200:
//  *         description: OK
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *       400:
//  *         description: Bad request
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: string
//  *       409:
//  *         description: Conflict
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: string
//  */
// router.put("/:feedbackId", verifyToken, isLoggedIn, controllers.updateFeedback);

// /**
//  * @swagger
//  * /api/v1/feedbacks/{feedbackId}:
//  *   delete:
//  *     security: 
//  *         - BearerAuth: []
//  *     summary: Delete feedback by id
//  *     tags: [Feedback]
//  *     parameters:
//  *       - in: path
//  *         name: feedbackId
//  *         schema:
//  *           type: string
//  *           example: 7dc19b05-7f0b-409d-ab57-23cdcf728aa3
//  *         required: true
//  *     responses:
//  *       200:
//  *         description: OK
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *       400:
//  *         description: Bad request
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: string
//  */
// router.delete("/:feedbackId", verifyToken, isLoggedIn, controllers.deleteFeedback);

// module.exports = router;
