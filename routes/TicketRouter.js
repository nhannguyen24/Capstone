const controllers = require('../controllers/TicketController');
const express = require('express');
const verifyToken = require('../middlewares/VerifyToken');
const {isAdmin} = require('../middlewares/VerifyRole');

const router = express.Router();

/**
 * @swagger
 * /api/v1/tickets:
 *   get:
 *     security: 
 *         - BearerAuth: []
 *     summary: get tickets 
 *     tags: [Ticket]
 * 
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
router.get("/", verifyToken, isAdmin, controllers.getAllTickets);

/**
 * @swagger
 * /api/v1/tickets/{ticketId}:
 *   get:
 *     security: 
 *         - BearerAuth: []
 *     summary: Get ticket by id
 *     tags: [Ticket]
 *     parameters:
 *       - in: path
 *         name: ticketId
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
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               type: string
 */
router.get("/:ticketId", verifyToken, isAdmin, controllers.getTicketById);

/**
 * @swagger
 * /api/v1/tickets:
 *   post:
 *     security: 
 *         - BearerAuth: []
 *     summary: Create a new ticket
 *     tags: [Ticket]
 *     requestBody:
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                  ticketTypeId:
 *                      type: string
 *                  tourId:
 *                      type: string
 *            example:
 *              {
 *                  ticketTypeId: d2dfa0b3-6b26-4a68-a093-05ca5f7f9cc6,
 *                  tourId: 72102f7f-3b83-47ff-b5c7-ea5e75a20c80,
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
 *       409:
 *         description: Conflict
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
router.post("/", verifyToken, isAdmin, controllers.createTicket);

/**
 * @swagger
 * /api/v1/tickets/{ticketId}:
 *   put:
 *     security: 
 *         - BearerAuth: []
 *     summary: Update ticket by id
 *     tags: [Ticket]
 *     parameters:
 *       - in: path
 *         name: ticketId
 *         schema:
 *           type: string
 *           example: 7dc19b05-7f0b-409d-ab57-23cdcf728aa3
 *         required: true
 *       - in: query
 *         name: tourId
 *         schema:
 *           type: string
 *           example: d406c07b-7f66-4a90-88d1-8c5cfdd34a42
 *       - in: query
 *         name: ticketTypeId
 *         schema:
 *           type: string
 *           example: d406c07b-7f66-4a90-88d1-8c5cfdd34a42
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum:
 *              - Active
 *              - Deactive
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
 *               type: object
 *       409:
 *         description: Conflict
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
router.put("/:ticketId", verifyToken, isAdmin, controllers.updateTicket);

/**
 * @swagger
 * /api/v1/tickets/{ticketId}:
 *   delete:
 *     security: 
 *         - BearerAuth: []
 *     summary: Delete ticket by id
 *     tags: [Ticket]
 *     parameters:
 *       - in: path
 *         name: ticketId
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
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       409:
 *         description: Conflict
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
router.delete("/:ticketId", verifyToken, isAdmin, controllers.deleteTicket);

module.exports = router;
