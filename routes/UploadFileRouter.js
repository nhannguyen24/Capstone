const {uploadFile, pushNotification} = require('../middlewares/FirebaseService')
const express = require('express');
const router = express.Router();
const verifyToken = require('../middlewares/VerifyToken');

/**
 * @swagger
 * /api/v1/firebase/upload-image:
 *   post:
 *     security: 
 *         - BearerAuth: []
 *     summary: Upload image
 *     tags: [Firebase]
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
 *       200:
 *         description: Upload image
 *         content:
 *           application/json:
 *             schema:
 *               type: string
 *               format: binary
 */
router.post("/upload-image", verifyToken, uploadFile);

/**
 * @swagger
 * /api/v1/firebase/push-notification:
 *   post:
 *     security: 
 *         - BearerAuth: []
 *     summary: Send notification
 *     tags: [Firebase]
 *     requestBody:
 *        content:
 *          application/json:
 *            example:
 *              notiType: Thay đổi lịch
 *              title: Thông báo
 *              content: Thông báo
 *              device_token: fgUsxMT4SkacqJBiDKZ1Lk:APA91bE0QeJytP3zfmUhZqUFfT6e9j9XyxNWqVJNNv2GLyMOjEY5A3mq4idmXhQZCze1p-JbZZt8ddcFcCD9AVNzzMvZxi-SE19x54_CqqDoqSRI1P5dPutLBzmSri4yQs2sxc5PO3a_
 *     responses:
 *       200:
 *         description: Upload image
 *         content:
 *           application/json:
 *             schema:
 *               type: string
 *               format: binary
 */
router.post("/push-notification", verifyToken, pushNotification);

module.exports = router;

