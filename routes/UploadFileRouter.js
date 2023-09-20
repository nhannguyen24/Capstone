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
 *     summary: Upload image
 *     tags: [Firebase]
 *     requestBody:
 *        content:
 *          application/json:
 *            example:
 *              title: Thông báo
 *              content: Thông báo
 *              device_token: eyJhbGciOiJSUzI1NiIsImtpZCI6IjE5MGFkMTE4YTk0MGFkYzlmMmY1Mzc2YjM1MjkyZmVkZThjMmQwZWUiLCJ0eXAiOiJKV1QifQ.eyJuYW1lIjoiUGjDumMgTMOqIEhvw6BuZyIsInBpY3R1cmUiOiJodHRwczovL2xoMy5nb29nbGV1c2VyY29udGVudC5jb20vYS9BQ2c4b2NLNUhqV0RQSUtucG1YbU1xdmhTRTVCeEFwdVFzR1JjZ2pEZUR2Z0paSlU9czk2LWMiLCJpc3MiOiJodHRwczovL3NlY3VyZXRva2VuLmdvb2dsZS5jb20vd2FsbGV0LWZwdCIsImF1ZCI6IndhbGxldC1mcHQiLCJhdXRoX3RpbWUiOjE2OTQ4NTY2OTcsInVzZXJfaWQiOiJhZDM2YXZTa3MwaExDdkRqUzdtdEpIUzRacUozIiwic3ViIjoiYWQzNmF2U2tzMGhMQ3ZEalM3bXRKSFM0WnFKMyIsImlhdCI6MTY5NDg1NjY5NywiZXhwIjoxNjk0ODYwMjk3LCJlbWFpbCI6InBodWNsaDE0MDZAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsImZpcmViYXNlIjp7ImlkZW50aXRpZXMiOnsiZ29vZ2xlLmNvbSI6WyIxMDI4OTQwODQ3MzI4OTYxMzY5MjciXSwiZW1haWwiOlsicGh1Y2xoMTQwNkBnbWFpbC5jb20iXX0sInNpZ25faW5fcHJvdmlkZXIiOiJnb29nbGUuY29tIn19.nQ93YE-Xf3qvguJgdayxSbJCzPrQk15yqbEwOFuEcJ-FCfLc-5RSj_esAKUF_6l-fGebMzQOz5r5OPGVTD3nzc70Z9qKocnPzgrQl7QZ8oKuIFCaDSsMaorUVwD3yDZNHYQyhn3BVF_CoaJGn8sZAwsKapC9Pa4SQqQxFKwfXIzNv_eDqNEVGKHaDetRQGD8xiCJ_FTT33fHIMBI6kivkBaAXWohV7pEmWbvD1ZpRzez4YE2psDHDA_ymbjBLZR0PMpArLAQqyOzpmiriHoePw00P-8L2x3_n5J8kOFWoKoQsiF4NuXBE-uwgmhOtwQbEyZC23WXtMjUe9xRA8Xrxw
 *     responses:
 *       200:
 *         description: Upload image
 *         content:
 *           application/json:
 *             schema:
 *               type: string
 *               format: binary
 */
router.get("/push-notification", verifyToken, pushNotification);

module.exports = router;

