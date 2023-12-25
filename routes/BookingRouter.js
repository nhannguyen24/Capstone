const controllers = require('../controllers/BookingController')
const express = require('express')
const verifyToken = require('../middlewares/VerifyToken')
const {roleAuthen} = require('../middlewares/VerifyRole')

const router = express.Router()

/**
 * @swagger
 * /api/v1/bookings:
 *   get:
 *     security: 
 *         - BearerAuth: []
 *     summary: Get bookings
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
 *         name: customerName
 *         schema:
 *           type: string
 *         description: Get booking with customer name
 *       - in: query
 *         name: bookingCode
 *         schema:
 *           type: string
 *         description: Search with booking code
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           example: 2023-10-23
 *         description: Search after this date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           example: 2023-10-29
 *         description: Search before this date
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
 *              - Draft
 *              - Ongoing
 *              - Canceled
 *              - Finished
 *         description: Draft (Booking havent pay "Cron Job can auto delete"), Ongoing (User not on tour yet), Canceled (Booking canceled), Finished(Tour Finished)
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
router.get("/", verifyToken, roleAuthen(["Manager", "TourGuide", "Customer"]), controllers.getBookings)

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
 *         description: Search with booking code
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           example: 2023-10-23
 *         description: Search after this date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           example: 2023-10-29
 *         description: Search before this date
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
 *         description: Ongoing (User not on tour yet), Canceled (Booking canceled), Finished(Tour Finished)
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
router.get("/email", controllers.getBookingsByEmail)

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
router.get("/:id", controllers.getBookingDetailByBookingId)

/**
 * @swagger
 * /api/v1/bookings/web:
 *   post:
 *     summary: Create new booking for web booking
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
 *            example: {
 *              totalPrice: 220000,
 *              departureStationId: 267aa90c-763c-406e-a7bc-944eae45020d,
 *              user: {
 *                  email: tquan@gmail.com,
 *                  userName: Trần Minh Quân,
 *                  phone: "0125224789",
 *              },
 *              tickets: [
 *                  {
 *                      ticketId: ,
 *                      ticketTypeId: ,  
 *                      scheduleId: ,
 *                      priceId: ,
 *                      quantity: 1
 *                  },
 *                  {
 *                      ticketId: ,
 *                      ticketTypeId: ,  
 *                      scheduleId: ,
 *                      priceId: ,
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
router.post("/web", controllers.createBookingWeb)

/**
 * @swagger
 * /api/v1/bookings/offline:
 *   post:
 *     security: 
 *         - BearerAuth: []
 *     summary: Create new booking for offline booking
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
 *            example: {
 *              totalPrice: 200000,
 *              departureStationId: 7da955dc-ee9a-4cc3-9011-a02002034aee,
 *              user: {
 *                  email: tminh@gmail.com,
 *                  userName: Trần Minh Quân,
 *                  phone: "0123456789",
 *              },
 *              tickets: [
 *                  {
 *                      ticketId: ,
 *                      ticketTypeId: ,  
 *                      scheduleId: ,
 *                      priceId: ,
 *                      quantity: 1
 *                  },
 *                  {
 *                      ticketId: ,
 *                      ticketTypeId: ,  
 *                      scheduleId: ,
 *                      priceId: ,
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
router.post("/offline", verifyToken, roleAuthen(["TourGuide"]), controllers.createBookingOffline)

/**
 * @swagger
 * /api/v1/bookings/{id}/checkin:
 *   put:
 *     security: 
 *         - BearerAuth: []
 *     summary: Check in When scan QR code
 *     tags: [Booking]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *       - in: query
 *         name: scheduleId
 *         schema:
 *           type: string
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
router.put("/:id/checkin", verifyToken, roleAuthen(["Manager", "TourGuide"]), controllers.checkInQrCode)

/**
 * @swagger
 * /api/v1/bookings/{id}/cancel:
 *   put:
 *     summary: Cancel booking
 *     tags: [Booking]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
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
router.put("/:id/cancel", controllers.cancelBooking)


module.exports = router
