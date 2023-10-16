const controllers = require('../controllers/TemplateDownloadController');
const express = require('express');
const verifyToken = require('../middlewares/VerifyToken');
const router = express.Router();
const {isAdminOrManager} = require('../middlewares/VerifyRole');

/**
 * @swagger
 * /api/v1/download:
 *   get:
 *     summary: Get excel template for create tour
 *     tags: [Template]
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: string
 */
router.get("/", controllers.downloadTourTemplate);

module.exports = router;