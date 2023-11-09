const controllers = require('../controllers/TemplateDownloadController');
const express = require('express');
const verifyToken = require('../middlewares/VerifyToken');
const router = express.Router();
const {roleAuthen} = require('../middlewares/VerifyRole');

/**
 * @swagger
 * /api/v1/download:
 *   get:
 *     summary: Get excel template for creating a tour
 *     tags: [Template]
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   description: A message indicating that the file is ready for download.
 *                 downloadUrl:
 *                   type: string
 *                   format: uri
 *                   description: The URL for downloading the Excel template for creating a tour.
 */
router.get("/", controllers.downloadTourTemplate);

module.exports = router;
