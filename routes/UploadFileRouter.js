const {uploadFile} = require('../middlewares/FirebaseService')
const express = require('express');
const router = express.Router();

/**
 * @swagger
 * /api/v1/upload-image:
 *   post:
 *     security: 
 *         - BearerAuth: []
 *     summary: Upload image
 *     tags: [upload-controller]
 *     requestBody:
 *          required: true
 *          content:
 *            multipart/form-data:
 *              schema:
 *                type: object
 *                properties:
 *                  files:  
 *                      type: array
 *                      items:
 *                        type: string
 *                        format: binary
 *     responses:
 *       200:
 *         description: Upload image
 *         content:
 *           application/json:
 *             schema:
 *               type: string
 *               format: binary
 */
router.post("/", uploadFile);


module.exports = router;

