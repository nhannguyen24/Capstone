const controllers = require('../controllers/TicketTypeController');
const express = require('express');
const verifyToken = require('../middlewares/VerifyToken');
const {roleAuthen} = require('../middlewares/VerifyRole');

const router = express.Router();

/**
 * @swagger
 * /api/v1/ticket-types:
 *   get:
 *     security: 
 *         - BearerAuth: []
 *     summary: get ticket-types 
 *     tags: [Ticket Type]
 * 
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
router.get("/", verifyToken, roleAuthen(["Manager"]), controllers.getTicketTypes);

/**
 * @swagger
 * /api/v1/ticket-types/{id}:
 *   get:
 *     security: 
 *         - BearerAuth: []
 *     summary: Get ticket-type by id
 *     tags: [Ticket Type]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           example: 7dc19b05-7f0b-409d-ab57-23cdcf728aa3
 *         required: true
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
router.get("/:id", verifyToken, roleAuthen(["Manager"]), controllers.getTicketTypeById);


/**
 * @swagger
 * /api/v1/ticket-types:
 *   post:
 *     security: 
 *         - BearerAuth: []
 *     summary: Create a new ticket-type
 *     tags: [Ticket Type]
 *     requestBody:
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                  ticketTypeName:
 *                      type: string
 *                  description:
 *                      type: string
 *                  dependsOnGuardian:
 *                      type: boolean
 *            example:
 *              {
 *                  ticketTypeName: Vé người lớn,
 *                  description: Vé dành cho người lớn trên 15 tuổi,
 *                  dependsOnGuardian: true or false,
 *              }
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
router.post("/", verifyToken, roleAuthen(["Manager"]), controllers.createTicketType);

/**
 * @swagger
 * /api/v1/ticket-types/{id}:
 *   put:
 *     security: 
 *         - BearerAuth: []
 *     summary: Update ticket-type by id
 *     tags: [Ticket Type]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *     requestBody:
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                  ticketTypeName:
 *                      type: string
 *                  description:
 *                      type: string
 *                  dependsOnGuardian:
 *                      type: boolean
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               type: string
 */
router.put("/:id", verifyToken, roleAuthen(["Manager"]), controllers.updateTicketType);


module.exports = router;
