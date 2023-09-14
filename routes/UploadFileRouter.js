const {uploadFile} = require('../middlewares/FirebaseService')
const express = require('express');
const router = express.Router();
const verifyToken = require('../middlewares/VerifyToken');

/**
 * @swagger
 * /api/v1/upload-image:
 *   post:
 *     security: 
 *         - BearerAuth: []
 *     summary: Upload image
 *     tags: [firebase-controller]
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
router.post("/", verifyToken, uploadFile);


module.exports = router;

