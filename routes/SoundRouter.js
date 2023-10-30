const controllers = require('../controllers/SoundController');
const express = require('express');
const verifyToken = require('../middlewares/VerifyToken');
const router = express.Router();
const {isAdminOrManager} = require('../middlewares/VerifyRole');

/**
 * @swagger
 * components:
 *   schemas:
 *     FileSound:
 *       type: object
 *       required:
 *       properties:
 *         soundId:
 *           type: string
 *           description: The auto-generated id of the sound
 *         file:
 *           type: string
 *           description: The sound file
 *         poiId:
 *           type: string
 *           description: The file sound of point of interest 
 *         languageId:
 *           type: string
 *           description: The file sound language
 *         status:
 *           type: string
 *           description: The sound status('Active', 'Deactive')
 */

/**
 * @swagger
 * /api/v1/sounds:
 *   get:
 *     security: 
 *         - BearerAuth: []
 *     summary: Returns the list of all the sounds
 *     tags: [FileSound]
 *     parameters:
 *       - name: languageId
 *         in: query
 *         schema:
 *           type: string
 *         description: Find sound by languageId
 *       - name: poiId
 *         in: query
 *         schema:
 *           type: string
 *         description: Find sound by point of interest
 *       - name: status
 *         in: query
 *         schema:
 *           type: string
 *           enum: ["Active", "Deactive"]
 *         description: Find sound by status
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
 *         description: Sort by (soundName/createdAt)
 *       - name: order[1]
 *         in: query
 *         schema:
 *           type: string
 *         description: Sort ASC/DESC
 *     responses:
 *       200:
 *         description: Get the list of the sounds successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/FileSound'
 */
router.get("/", verifyToken, controllers.getAllFileSound);

/**
 * @swagger
 * /api/v1/sounds/{id}:
 *   get:
 *     security: 
 *         - BearerAuth: []
 *     summary: Returns the the sounds by id
 *     tags: [FileSound]
 *     parameters:
 *       - name: id
 *         in: path
 *         schema:
 *           type: string
 *         description: Find sound by soundId
 *     responses:
 *       200:
 *         description: Get the sound by id successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/FileSound'
 */
router.get("/:id", verifyToken, controllers.getFileSoundById);

/**
 * @swagger
 * /api/v1/sounds:
 *   post:
 *     security:
 *       - BearerAuth: []
 *     summary: Create new sound
 *     tags: [FileSound]
 *     requestBody:
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/FileSound'
 *            example:
 *              file: string
 *              languageId: 8c382e13-8620-460a-bd95-96b1152c1368
 *              poiId: 8c382e13-8620-460a-bd95-96b1152c1368
 *     responses:
 *       200:
 *         description: Create new sound successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/FileSound'
 */
router.post("/", verifyToken, isAdminOrManager, controllers.createFileSound);

/**
 * @swagger
 * /api/v1/sounds:
 *   put:
 *     security: 
 *         - BearerAuth: []
 *     summary: Update the sound by id
 *     tags: [FileSound]
 *     requestBody:
 *       content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/FileSound'
 *            example:
 *              soundId: 8c382e13-8620-460a-bd95-96b1152c1368
 *              file: string
 *              languageId: 8c382e13-8620-460a-bd95-96b1152c1368
 *              poiId: 8c382e13-8620-460a-bd95-96b1152c1368
 *              status: Active
 *     responses:
 *       200:
 *         description: Update the sound successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/FileSound'
 */
router.put("/", verifyToken, isAdminOrManager, controllers.updateFileSound);

/**
 * @swagger
 * /api/v1/sounds:
 *   delete:
 *     security: 
 *         - BearerAuth: []
 *     summary: Delete the sounds by id
 *     tags: [FileSound]
 *     parameters:
 *       - name: soundId
 *         in: query
 *         schema:
 *           type: string
 *         description: Input soundId to delete
 *     responses:
 *       200:
 *         description: Delete the sounds by id successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/FileSound'
 */
router.delete("/", verifyToken, isAdminOrManager, controllers.deleteFileSound);

module.exports = router;
