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
 *         name: tourId
 *         schema:
 *           type: string
 *         description: Search with tourId
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
 *         name: tourId
 *         schema:
 *           type: string
 *         description: Search with tourId
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
 *     summary: Get booking detail by booking id
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
 *                  products:
 *                      type: array
 *                  tickets:
 *                      type: array
 *            example: {
 *              totalPrice: 70000,
 *              departureStationId: 267aa90c-763c-406e-a7bc-944eae45020d,
 *              user: {
 *                  email: tminhquan@gmail.com,
 *                  userName: Trần Minh Quân,
 *                  phone: 0123456789,
 *                  birthday: 2000-09-11
 *              },
 *              products: [
 *                  {
 *                      productId: 8d2340e0-acdd-4411-bcca-453c790cd8cd,
 *                      quantity: 1
 *                  }
 *              ],
 *              tickets: [
 *                  {
 *                      ticketId: 06bec4fd-d3aa-418d-af37-c5037dc313aa,
 *                      ticketTypeId: 3355c24a-741c-4e3b-9d2a-fa43c4c950c5,  
 *                      tourId: d16d6812-3772-4f72-a3fb-c7a617397c3c,
 *                      priceId: cfa845b9-3182-4322-932d-05a6284e6928,
 *                      quantity: 1
 *                  },
 *                  {
 *                      ticketId: 2b4e447c-289a-4dc3-be4b-01d955e05578,
 *                      ticketTypeId: 99f73c58-7c81-4152-90f9-21e50637e9c8,  
 *                      tourId: d16d6812-3772-4f72-a3fb-c7a617397c3c,
 *                      priceId: 83bdc7a1-c77e-46c7-b8f0-de7fd4bf5859,
 *                      quantity: 1
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
