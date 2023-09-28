const controllers = require('../controllers/TicketTypeController');
const express = require('express');
const verifyToken = require('../middlewares/VerifyToken');
const {isAdmin} = require('../middlewares/VerifyRole');

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
router.get("/", verifyToken, isAdmin, controllers.getAllTicketTypes);

/**
 * @swagger
 * /api/v1/ticket-types/{ticketTypeId}:
 *   get:
 *     security: 
 *         - BearerAuth: []
 *     summary: Get ticket-type by id
 *     tags: [Ticket Type]
 *     parameters:
 *       - in: path
 *         name: ticketTypeId
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
router.get("/:ticketTypeId", verifyToken, isAdmin, controllers.getTicketTypeById);


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
 *            example:
 *              {
 *                  ticketTypeName: Vé người lớn,
 *                  description: Vé dành cho người lớn trên 15 tuổi,
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
router.post("/", verifyToken, isAdmin, controllers.createTicketType);

/**
 * @swagger
 * /api/v1/ticket-types/{ticketTypeId}:
 *   put:
 *     security: 
 *         - BearerAuth: []
 *     summary: Update ticket-type by id
 *     tags: [Ticket Type]
 *     parameters:
 *       - in: path
 *         name: ticketTypeId
 *         schema:
 *           type: string
 *           example: 7dc19b05-7f0b-409d-ab57-23cdcf728aa3
 *         required: true
 *       - in: query
 *         name: ticketTypeName
 *         schema:
 *           type: string
 *           example: Vé người lớn 
 *       - in: query
 *         name: description
 *         schema:
 *           type: string
 *           example: Vé dành cho người lớn trên 15 tuổi
 *        
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
router.put("/:ticketTypeId", verifyToken, isAdmin, controllers.updateTicketType);

// /**
//  * @swagger
//  * /api/v1/ticket-types/{ticketTypeId}:
//  *   delete:
//  *     security: 
//  *         - BearerAuth: []
//  *     summary: Update ticket-type status by id
//  *     tags: [Ticket Type]
//  *     parameters:
//  *       - in: path
//  *         name: ticketTypeId
//  *         schema:
//  *           type: string
//  *           example: 7dc19b05-7f0b-409d-ab57-23cdcf728aa3
//  *         required: true
//  *     responses:
//  *       200:
//  *         description: OK
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  */
// router.delete("/:ticketTypeId", verifyToken, isAdmin, controllers.deleteTicketType);

module.exports = router;
