const controllers = require('../controllers/TemplateDownloadController');
const express = require('express');
const verifyToken = require('../middlewares/VerifyToken');
const {roleAuthen} = require('../middlewares/VerifyRole');

const router = express.Router();

// /**
//  * @swagger
//  * /api/v1/download:
//  *   get:
//  *     security: 
//  *         - BearerAuth: []
//  *     summary: Get excel template for creating a tour
//  *     tags: [Template]
//  *     responses:
//  *       200:
//  *         description: OK
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 url:
//  *                   type: string
//  *                   description: FILE URL.
//  */
// router.get("/",  verifyToken, roleAuthen(["Manager"]), controllers.downloadTourTemplate);

module.exports = router;
