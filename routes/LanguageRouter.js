const controllers = require('../controllers/LanguageController');
const express = require('express');
const verifyToken = require('../middlewares/VerifyToken');
const router = express.Router();
const {roleAuthen} = require('../middlewares/VerifyRole');

/**
 * @swagger
 * components:
 *   schemas:
 *     Language:
 *       type: object
 *       required:
 *       properties:
 *         languageId:
 *           type: string
 *           description: The auto-generated id of the language
 *         language:
 *           type: string
 *           description: The language name
 *         status:
 *           type: string
 *           description: The language status('Active', 'Deactive')
 */

/**
 * @swagger
 * /api/v1/languages:
 *   get:
 *     security: 
 *         - BearerAuth: []
 *     summary: Returns the list of all the languages
 *     tags: [Language]
 *     parameters:
 *       - name: language
 *         in: query
 *         schema:
 *           type: string
 *         description: Find language by language
 *       - name: status
 *         in: query
 *         schema:
 *           type: string
 *           enum: ["Active", "Deactive"]
 *         description: Find language by status
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
 *         description: Sort by (language/createdAt)
 *       - name: order[1]
 *         in: query
 *         schema:
 *           type: string
 *         description: Sort ASC/DESC
 *     responses:
 *       200:
 *         description: Get the list of the languages successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Language'
 */
router.get("/", verifyToken, controllers.getAllLanguage);

/**
 * @swagger
 * /api/v1/languages/{id}:
 *   get:
 *     security: 
 *         - BearerAuth: []
 *     summary: Returns the the languages by id
 *     tags: [Language]
 *     parameters:
 *       - name: id
 *         in: path
 *         schema:
 *           type: string
 *         description: Find language by languageId
 *     responses:
 *       200:
 *         description: Get the language by id successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Language'
 */
router.get("/:id", verifyToken, controllers.getLanguageById);

/**
 * @swagger
 * /api/v1/languages:
 *   post:
 *     security:
 *       - BearerAuth: []
 *     summary: Create new language
 *     tags: [Language]
 *     requestBody:
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/Language'
 *            example:
 *              language: vn
 *     responses:
 *       200:
 *         description: Create new language successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Language'
 */
router.post("/", verifyToken, roleAuthen(["Manager"]), controllers.createLanguage);

/**
 * @swagger
 * /api/v1/languages/{id}:
 *   put:
 *     security: 
 *         - BearerAuth: []
 *     summary: Update the language by id
 *     tags: [Language]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Update language by languageId
 *     requestBody:
 *       content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/Language'
 *            example:
 *              language: vn
 *              status: Active
 *     responses:
 *       200:
 *         description: Update the language successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Language'
 */
router.put("/:id", verifyToken, roleAuthen(["Manager"]), controllers.updateLanguage);

/**
 * @swagger
 * /api/v1/languages/{id}:
 *   delete:
 *     security: 
 *         - BearerAuth: []
 *     summary: Delete the languages by id
 *     tags: [Language]
 *     parameters:
 *       - name: id
 *         in: path
 *         schema:
 *           type: string
 *         description: Input languageId to delete
 *     responses:
 *       200:
 *         description: Delete the languages by id successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Language'
 */
router.delete("/:id", verifyToken, roleAuthen(["Manager"]), controllers.deleteLanguage);

module.exports = router;
