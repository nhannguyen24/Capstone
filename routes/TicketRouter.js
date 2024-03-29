const controllers = require('../controllers/TicketController');
const express = require('express');
const verifyToken = require('../middlewares/VerifyToken');
const {roleAuthen} = require('../middlewares/VerifyRole');

const router = express.Router();

/**
 * @swagger
 * /api/v1/tickets:
 *   get:
 *     security: 
 *         - BearerAuth: []
 *     summary: get tickets 
 *     tags: [Ticket]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           example: 1
 *         required: true
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           example: 10
 *         required: true
 *         description: Maximum items per page
 *       - in: query
 *         name: tourId
 *         schema:
 *           type: string
 *         description: Search by tourId
 *       - in: query
 *         name: ticketTypeId
 *         schema:
 *           type: string
 *         description: Search by ticketTypeId
 * 
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
router.get("/", verifyToken, roleAuthen(["Manager"]), controllers.getTickets);

/**
 * @swagger
 * /api/v1/tickets/{id}:
 *   get:
 *     security: 
 *         - BearerAuth: []
 *     summary: Get ticket by id
 *     tags: [Ticket]
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
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               type: string
 */
router.get("/:id", verifyToken, roleAuthen(["Manager"]), controllers.getTicketById);

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
router.post("/", verifyToken, roleAuthen(["Manager"]), controllers.createTicket);

/**
 * @swagger
 * /api/v1/tickets/{id}:
 *   put:
 *     security: 
 *         - BearerAuth: []
 *     summary: Update ticket by id
 *     tags: [Ticket]
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
 *                  ticketTypeId:
 *                      type: string
 *                  status:
 *                      type: string
 *                      enum:
 *                          - Active
 *                          - Deactive
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
router.put("/:id", verifyToken, roleAuthen(["Manager"]), controllers.updateTicket);

/**
 * @swagger
 * /api/v1/tickets/{id}:
 *   delete:
 *     security: 
 *         - BearerAuth: []
 *     summary: Delete ticket by id
 *     tags: [Ticket]
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
router.delete("/:id", verifyToken, roleAuthen(["Manager"]), controllers.deleteTicket);

module.exports = router;
