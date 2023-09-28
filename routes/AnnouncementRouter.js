const controllers = require('../controllers/AnnouncementController');
const express = require('express');
const verifyToken = require('../middlewares/VerifyToken');
const router = express.Router();
const {isManager, isAdminOrManagerOrTourguideOrDriver} = require('../middlewares/VerifyRole');

/**
 * @swagger
 * components:
 *   schemas:
 *     Announcement:
 *       type: object
 *       required:
 *       properties:
 *         announcementId:
 *           type: string
 *           description: The auto-generated id of the announcement
 *         title:
 *           type: string
 *           description: The announcement title
 *         description:
 *           type: string
 *           description: The announcement description
 *         status:
 *           type: string
 *           description: The announcement status('Active', 'Deactive')
 */

/**
 * @swagger
 * /api/v1/announcements:
 *   get:
 *     security: 
 *         - BearerAuth: []
 *     summary: Returns the list of all the announcements
 *     tags: [Announcement]
 *     parameters:
 *       - name: title
 *         in: query
 *         schema:
 *           type: string
 *         description: Find announcement by title
 *       - name: status
 *         in: query
 *         schema:
 *           type: string
 *           enum: ["Active", "Deactive"]
 *         description: Find announcement by status
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
 *         description: Sort by (announcementName/createdAt)
 *       - name: order[1]
 *         in: query
 *         schema:
 *           type: string
 *         description: Sort ASC/DESC
 *     responses:
 *       200:
 *         description: Get the list of the announcements successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Announcement'
 */
router.get("/", verifyToken, isAdminOrManagerOrTourguideOrDriver, controllers.getAllAnnouncement);

/**
 * @swagger
 * /api/v1/announcements/{id}:
 *   get:
 *     security: 
 *         - BearerAuth: []
 *     summary: Returns the the announcements by id
 *     tags: [Announcement]
 *     parameters:
 *       - name: id
 *         in: path
 *         schema:
 *           type: string
 *         description: Find announcement by announcementId
 *     responses:
 *       200:
 *         description: Get the announcement by id successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Announcement'
 */
router.get("/:id", verifyToken, isAdminOrManagerOrTourguideOrDriver, controllers.getAnnouncementById);

/**
 * @swagger
 * /api/v1/announcements:
 *   post:
 *     security:
 *       - BearerAuth: []
 *     summary: Create new announcement
 *     tags: [Announcement]
 *     requestBody:
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/Announcement'
 *            example:
 *              title: Thông báo
 *              description: Kiểm tra sức khỏe định kì
 *     responses:
 *       200:
 *         description: Create new announcement successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Announcement'
 */
router.post("/", verifyToken, isManager, controllers.createAnnouncement);

/**
 * @swagger
 * /api/v1/announcements:
 *   put:
 *     security: 
 *         - BearerAuth: []
 *     summary: Update the announcement by id
 *     tags: [Announcement]
 *     requestBody:
 *       content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/Announcement'
 *            example:
 *              announcementId: 8c382e13-8620-460a-bd95-96b1152c1368
 *              title: Thông báo
 *              description: Kiểm tra sức khỏe định kì
 *              status: Active
 *     responses:
 *       200:
 *         description: Update the announcement successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Announcement'
 */
router.put("/", verifyToken, isManager, controllers.updateAnnouncement);

/**
 * @swagger
 * /api/v1/announcements:
 *   delete:
 *     security: 
 *         - BearerAuth: []
 *     summary: Delete the announcements by id
 *     tags: [Announcement]
 *     parameters:
 *       - name: announcementIds[0]
 *         in: query
 *         schema:
 *           type: string
 *         description: Input announcementId to delete
 *     responses:
 *       200:
 *         description: Delete the announcements by id successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Announcement'
 */
router.delete("/", verifyToken, isManager, controllers.deleteAnnouncement);

module.exports = router;
