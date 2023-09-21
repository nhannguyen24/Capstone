const controllers = require('../controllers/BookingController');
const express = require('express');
const verifyToken = require('../middlewares/VerifyToken');
const {isAdminOrManager, isCustomer} = require('../middlewares/VerifyRole');

const router = express.Router();

/**
 * @swagger
 * /api/v1/bookings:
 *   get:
 *     security: 
 *         - BearerAuth: []
 *     summary: Get bookings by bookingCode and cutomerId for customer 
 *     tags: [Booking]
 *     parameters:
 *       - in: query
 *         name: customerId
 *         schema:
 *           type: string
 *           example: 224e8a10-4933-486d-8df2-b799905cde83
 *         required: true
 *       - in: query
 *         name: bookingCode
 *         schema:
 *           type: string
 *           example: 23
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
router.get("/", verifyToken, isCustomer, controllers.getBookingsForCustomer);

/**
 * @swagger
 * /api/v1/bookings/manager:
 *   get:
 *     security: 
 *         - BearerAuth: []
 *     summary: Get bookings for manager
 *     tags: [Booking]
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
router.get("/manager", verifyToken,  isAdminOrManager, controllers.getBookingsForManager);

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
 *           example: dnhan2426@gmail.com
 *         required: true
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
 * /api/v1/bookings:
 *   post:
 *     security: 
 *         - BearerAuth: []
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
 *                  user:
 *                      type: object
 *                  tickets:
 *                      type: array
 *                      minItems: 1
 *            example: {
 *              totalPrice: 250000,
 *              user: {
 *                  email: tminhquan999@gmail.com,
 *                  fullName: Trần Minh Quân,
 *                  phone: 0123456789,
 *                  birthday: 25/08/2000
 *              },
 *              tickets: [
 *                  {
 *                      ticketId: 8cf7a629-54b7-4ba5-8530-c921e71408f3,
 *                      ticketTypeId: d406c07b-7f66-4a90-88d1-8c5cfdd34a42,  
 *                      tourId: 72102f7f-3b83-47ff-b5c7-ea5e75a20c80,
 *                      priceId: 070cf314-0141-40cd-b2cc-8049770878f0,
 *                      quantity: 1
 *                  },
 *                  {
 *                      ticketId: 8cf7a629-54b7-4ba5-8530-c921e71408f3,
 *                      ticketTypeId: d406c07b-7f66-4a90-88d1-8c5cfdd34a42,
 *                      tourId: 72102f7f-3b83-47ff-b5c7-ea5e75a20c80,
 *                      priceId: c03fb653-a04c-4a5d-a24a-c8ea02398bc0,
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
router.post("/", verifyToken, isAdminOrManager, controllers.getBookingsForCustomer);

/**
 * @swagger
 * /api/v1/bookings/{bookingId}:
 *   get:
 *     security: 
 *         - BearerAuth: []
 *     summary: Get booking detail by bookingId
 *     tags: [Booking]
 *     parameters:
 *       - in: path
 *         name: bookingId
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
router.get("/:bookingId", verifyToken, isAdminOrManager, controllers.getBookingDetailByBookingId);


/**
 * @swagger
 * /api/v1/bookings/{bookingId}:
 *   put:
 *     security: 
 *         - BearerAuth: []
 *     summary: Update booking by id
 *     tags: [Booking]
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         schema:
 *           type: string
 *           example: 7dc19b05-7f0b-409d-ab57-23cdcf728aa3
 *         required: true
 *       - in: query
 *         name: bookingStatus
 *         schema:
 *           type: string
 *           enum:
 *              - OnGoing
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
router.put("/:bookingId", verifyToken, isAdminOrManager, controllers.updateBooking);

/**
 * @swagger
 * /api/v1/bookings/{bookingId}:
 *   delete:
 *     security: 
 *         - BearerAuth: []
 *     summary: Delete booking by id
 *     tags: [Booking]
 *     parameters:
 *       - in: path
 *         name: bookingId
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
router.delete("/:bookingId", verifyToken, isAdminOrManager, controllers.deleteBooking);

module.exports = router;
