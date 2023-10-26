const controllers = require('../controllers/FormController');
const express = require('express');
const verifyToken = require('../middlewares/VerifyToken');
const router = express.Router();
const {isAdminOrManager, isTourguideOrDriver, isAdminOrManagerOrTourguideOrDriver} = require('../middlewares/VerifyRole');

/**
 * @swagger
 * components:
 *   schemas:
 *     Form:
 *       type: object
 *       required:
 *       properties:
 *         formId:
 *           type: string
 *           description: The auto-generated id of the form
 *         reason:
 *           type: string
 *           description: The form reason
 *         file:
 *           type: string
 *           description: The form file
 *         currentTour:
 *           type: number
 *           description: The current employee's tour
 *         desireTour:
 *           type: number
 *           description: The desire tour which employee want to change
 *         changeEmployee:
 *           type: number
 *           description: The employee slot which employee want to change
 *         status:
 *           type: string
 *           description: The form status('Active', 'Deactive')
 */

/**
 * @swagger
 * /api/v1/forms:
 *   get:
 *     security: 
 *         - BearerAuth: []
 *     summary: Returns the list of all the forms
 *     tags: [Form]
 *     parameters:
 *       - name: userId
 *         in: query
 *         schema:
 *           type: string
 *         description: Find form by userId
 *       - name: changeEmployee
 *         in: query
 *         schema:
 *           type: string
 *         description: Find form by change employee id
 *       - name: status
 *         in: query
 *         schema:
 *           type: string
 *           enum: ["Active", "Approved", "Rejected"]
 *         description: Find form by status
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
 *         description: Sort by (formName/createdAt)
 *       - name: order[1]
 *         in: query
 *         schema:
 *           type: string
 *         description: Sort ASC/DESC
 *     responses:
 *       200:
 *         description: Get the list of the forms successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Form'
 */
router.get("/", verifyToken, controllers.getAllForm);

/**
 * @swagger
 * /api/v1/forms/{id}:
 *   get:
 *     security: 
 *         - BearerAuth: []
 *     summary: Returns the the forms by id
 *     tags: [Form]
 *     parameters:
 *       - name: id
 *         in: path
 *         schema:
 *           type: string
 *         description: Find form by formId
 *     responses:
 *       200:
 *         description: Get the form by id successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Form'
 */
router.get("/:id", verifyToken, controllers.getFormById);

/**
 * @swagger
 * /api/v1/forms:
 *   post:
 *     security:
 *       - BearerAuth: []
 *     summary: Create new form
 *     tags: [Form]
 *     requestBody:
 *       content:
 *          application/json:
 *            schema:                     
 *                  example:
 *                    reason: Có việc bận muốn đổi chuyến khác
 *                    file: string
 *                    currentTour: 8c382e13-8620-460a-bd95-96b1152c1368
 *                    desireTour: 8c382e13-8620-460a-bd95-96b1152c1368
 *                    changeEmployee: 8c382e13-8620-460a-bd95-96b1152c1368
 *     responses:
 *       200:
 *         description: Create new form successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Form'
 */
router.post("/", verifyToken, isTourguideOrDriver, controllers.createForm);

/**
 * @swagger
 * /api/v1/forms:
 *   put:
 *     security: 
 *         - BearerAuth: []
 *     summary: Update the form by id
 *     tags: [Form]
 *     parameters:
 *       - name: formId
 *         in: query
 *         schema:
 *           type: string
 *         description: Find form by formId
 *       - name: status
 *         in: query
 *         schema:
 *           type: string
 *           enum: ["Active", "Accepted", "Declined", "Approved", "Rejected"]
 *     responses:
 *       200:
 *         description: Update the form successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Form'
 */
router.put("/", verifyToken, isAdminOrManagerOrTourguideOrDriver, controllers.updateForm);

module.exports = router;
