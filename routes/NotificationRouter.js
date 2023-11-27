const controllers = require('../controllers/NotificationController');
const express = require('express');
const verifyToken = require('../middlewares/VerifyToken');
const router = express.Router();
const {roleAuthen} = require('../middlewares/VerifyRole');

/**
 * @swagger
 * components:
 *   schemas:
 *     Notification:
 *       type: object
 *       required:
 *       properties:
 *         notiId:
 *           type: string
 *           description: The auto-generated id of the notification
 *         title:
 *           type: string
 *           description: The notification title
 *         body:
 *           type: string
 *           description: The notification body
 *         deviceToken:
 *           type: string
 *           description: The notification device token
 *         notiType:
 *           type: string
 *           description: The notification type
 *         status:
 *           type: string
 *           description: The notification status('Active', 'Deactive')
 */

/**
 * @swagger
 * /api/v1/notifications:
 *   get:
 *     security: 
 *         - BearerAuth: []
 *     summary: Returns the list of all the notifications
 *     tags: [Notification]
 *     parameters:
 *       - name: userId
 *         in: query
 *         schema:
 *           type: string
 *         description: Find notification by userId
 *       - name: createdDate
 *         in: query
 *         schema:
 *           type: string
 *         description: Find notification by create date (2023-11-10)
 *       - name: status
 *         in: query
 *         schema:
 *           type: string
 *           enum: ["Active", "Deactive"]
 *         description: Find notification by status
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
 *         description: Sort by (notificationName/createdAt)
 *       - name: order[1]
 *         in: query
 *         schema:
 *           type: string
 *         description: Sort ASC/DESC
 *     responses:
 *       200:
 *         description: Get the list of the notifications successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Notification'
 */
router.get("/", verifyToken, controllers.getAllNotification);

/**
 * @swagger
 * /api/v1/notifications/{id}:
 *   get:
 *     security: 
 *         - BearerAuth: []
 *     summary: Returns the the notifications by id
 *     tags: [Notification]
 *     parameters:
 *       - name: id
 *         in: path
 *         schema:
 *           type: string
 *         description: Find notification by notiId
 *     responses:
 *       200:
 *         description: Get the notification by id successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Notification'
 */
router.get("/:id", verifyToken, controllers.getNotificationById);

/**
 * @swagger
 * /api/v1/notifications/{id}:
 *   put:
 *     security: 
 *         - BearerAuth: []
 *     summary: Update the user by id
 *     tags: [Notification]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Update user by id
 *     requestBody:
 *       content:
 *          application/json:
 *            schema:                     
 *                  example:
 *                    deviceToken: fgUsxMT4SkacqJBiDKZ1Lk:APA91bE0QeJytP3zfmUhZqUFfT6e9j9XyxNWqVJNNv2GLyMOjEY5A3mq4idmXhQZCze1p-JbZZt8ddcFcCD9AVNzzMvZxi-SE19x54_CqqDoqSRI1P5dPutLBzmSri4yQs2sxc5PO3a_
 *     responses:
 *       200:
 *         description: Update the user successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Notification'
 */
router.put("/:id", verifyToken, controllers.updateDeviceToken);

/**
 * @swagger
 * /api/v1/notifications/{id}:
 *   delete:
 *     security: 
 *         - BearerAuth: []
 *     summary: Delete the notifications by id
 *     tags: [Notification]
 *     parameters:
 *       - name: id
 *         in: path
 *         schema:
 *           type: string
 *         description: Input notificationId to delete
 *     responses:
 *       200:
 *         description: Delete the notifications by id successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Notification'
 */
router.delete("/:id", verifyToken, controllers.deleteNotification);

module.exports = router;
