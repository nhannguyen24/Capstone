const controllers = require('../controllers/BookingController');
const express = require('express');
const verifyToken = require('../middlewares/VerifyToken');
const {isAdminOrManager, isCustomer, isLoggedIn} = require('../middlewares/VerifyRole');

const router = express.Router();

/**
 * @swagger
 * /api/v1/bookings:
 *   get:
 *     security: 
 *         - BearerAuth: []
 *     summary: Get bookings by bookingCode and cutomerId
 *     tags: [Booking]
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
 *         name: customerId
 *         schema:
 *           type: string
 *         description: Get booking with customerId
 *       - in: query
 *         name: bookingCode
 *         schema:
 *           type: string
 *           example: BO23
 *         description: Search with booking code
 *       - in: query
 *         name: bookingStatus
 *         schema:
 *           type: string
 *           enum:
 *              - Ongoing
 *              - Canceled
 *              - Finished
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum:
 *              - Draft
 *              - Active
 *              - Deactive
 *       - in: query
 *         name: orderDate
 *         schema:
 *           type: string
 *           enum:
 *              - DESC
 *              - ASC
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
router.get("/", verifyToken, isLoggedIn, controllers.getBookings);

/**
 * @swagger
 * /api/v1/bookings/email:
 *   get:
 *     summary: Get bookings by email for not logged in customer 
 *     tags: [Booking]
 *     parameters:
 *       - in: query
 *         name: email
 *         schema:
 *           type: string
 *           example: abx@gmail.com
 *         required: true
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
 *         name: bookingCode
 *         schema:
 *           type: string
 *           example: BO23
 *         description: Search with booking code
 *       - in: query
 *         name: bookingStatus
 *         schema:
 *           type: string
 *           enum:
 *              - Ongoing
 *              - Canceled
 *              - Finished
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum:
 *              - Draft
 *              - Active
 *              - Deactive
 *       - in: query
 *         name: orderDate
 *         schema:
 *           type: string
 *           enum:
 *              - DESC
 *              - ASC
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
router.get("/email", controllers.getBookingsByEmail);

/**
 * @swagger
 * /api/v1/bookings/{id}:
 *   get:
 *     summary: Get booking by id
 *     tags: [Booking]
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
router.get("/:id", controllers.getBookingDetailByBookingId);

/**
 * @swagger
 * /api/v1/bookings:
 *   post:
 *     summary: Create new booking
 *     tags: [Booking]
 *     requestBody:
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                  totalPrice:
 *                      type: integer
 *                  departureStationId:
 *                      type: string
 *                  user:
 *                      type: object
 *                  tickets:
 *                      type: array
 *                      minItems: 1
 *            example: {
 *              totalPrice: 425000,
 *              departureStationId: a1685c29-7e2e-409f-8a12-e935b2a34b01,
 *              user: {
 *                  email: tminhquan@gmail.com,
 *                  userName: Trần Minh Quân,
 *                  phone: 0123456789,
 *                  birthday: 2000-09-11
 *              },
 *              tickets: [
 *                  {
 *                      ticketId: 074ed7f1-1d42-45c7-825e-37dc9ecf2e87,
 *                      ticketTypeId: d2dfa0b3-6b26-4a68-a093-05ca5f7f9cc6,  
 *                      tourId: 72102f7f-3b83-47ff-b5c7-ea5e75a20c80,
 *                      priceId: 2cd8ed5d-0108-4a81-b4a6-ddc8c9ee6586,
 *                      quantity: 1
 *                  },
 *                  {
 *                      ticketId: 8cf7a629-54b7-4ba5-8530-c921e71408f3,
 *                      ticketTypeId: d406c07b-7f66-4a90-88d1-8c5cfdd34a42,
 *                      tourId: 72102f7f-3b83-47ff-b5c7-ea5e75a20c80,
 *                      priceId: 0ae1dd7a-4833-47c7-b99c-75755539245b,
 *                      quantity: 2
 *                  },
 *              ]
 *            }
 *     responses:
 *       201:
 *         description: CREATED
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
router.post("/", controllers.createBooking);

/**
 * @swagger
 * /api/v1/bookings/{id}:
 *   put:
 *     summary: Update booking by id
 *     tags: [Booking]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           example: 77ff7316-581e-448e-86c3-436263b277d1
 *         required: true
 *       - in: query
 *         name: isAttended
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: bookingStatus
 *         schema:
 *           type: string
 *           enum:
 *              - Ongoing
 *              - Canceled
 *              - Finished
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
 *               type: object
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
router.put("/:id", controllers.updateBooking);

/**
 * @swagger
 * /api/v1/bookings/{id}:
 *   delete:
 *     security: 
 *         - BearerAuth: []
 *     summary: Delete booking by id
 *     tags: [Booking]
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
 *       409:
 *         description: Conflict
 *         content:
 *           application/json:
 *             schema:
 *               type: string
 */
router.delete("/:id", verifyToken, isAdminOrManager, controllers.deleteBooking);

module.exports = router;
