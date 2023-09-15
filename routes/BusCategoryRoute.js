const controllers = require('../controllers/BusCategoryController');
const express = require('express');
const verifyToken = require('../middlewares/VerifyToken');
const {isAdminOrManager} = require('../middlewares/VerifyRole');

const router = express.Router();

/**
 * @swagger
 * /api/v1/bus-cates:
 *   get:
 *     security: 
 *         - BearerAuth: []
 *     summary: Get all bus categories
 *     tags: [bus-category-controller]
 * 
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
router.get("/", verifyToken, isAdminOrManager, controllers.getAllBusCates);


/**
 * @swagger
 * /api/v1/bus-cates:
 *   post:
 *     security: 
 *         - BearerAuth: []
 *     summary: Create a new bus category
 *     tags: [bus-category-controller]
 *     parameters:
 *       - in: query
 *         name: busCateName
 *         schema:
 *           type: string
 *           example: Double Decker Bus
 *         required: true
 *     responses:
 *       201:
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
router.post("/", verifyToken, isAdminOrManager, controllers.createBusCate);

/**
 * @swagger
 * /api/v1/bus-cates/{busCateId}:
 *   put:
 *     security: 
 *         - BearerAuth: []
 *     summary: Update bus category by id
 *     tags: [bus-category-controller]
 *     parameters:
 *       - in: path
 *         name: busCateId
 *         schema:
 *           type: string
 *           example: 79973808-e97f-4487-9677-3cc0d57248a2
 *         required: true
 *       - in: query
 *         name: busCateName
 *         schema:
 *           type: string
 *           example: Advanced Double Decker Bus
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum:
 *              - Active
 *              - Deactive
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: string
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               type: string
 *       409:
 *         description: Conflict
 *         content:
 *           application/json:
 *             schema:
 *               type: string
 */
router.put("/:busCateId", verifyToken, isAdminOrManager, controllers.updateBusCate);

/**
 * @swagger
 * /api/v1/bus-cates/{busCateId}:
 *   delete:
 *     security: 
 *         - BearerAuth: []
 *     summary: Deactive a bus category by id
 *     tags: [bus-category-controller]
 *     parameters:
 *       - in: path
 *         name: busCateId
 *         schema:
 *           type: string
 *           example: 79973808-e97f-4487-9677-3cc0d57248a2
 *         required: true
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: string
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               type: string
 *       409:
 *         description: Conflict
 *         content:
 *           application/json:
 *             schema:
 *               type: string
 */
router.delete("/:busCateId", verifyToken, isAdminOrManager, controllers.deleteBusCate);

module.exports = router;
