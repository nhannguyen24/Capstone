const controllers = require('../controllers/BookingDetailController');
const express = require('express');
const verifyToken = require('../middlewares/VerifyToken');
const {isAdminOrManager} = require('../middlewares/VerifyRole');

const router = express.Router();

/**
 * @swagger
 * /api/v1/booking-details/{bookingId}:
 *   get:
 *     security: 
 *         - BearerAuth: []
 *     summary: Get booking detail by booking id
 *     tags: [Booking-Detail]
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
 */
router.get("/:bookingId", verifyToken, isAdminOrManager, controllers.getBookingById);

/**
 * @swagger
 * /api/v1/booking-details/{bookingId}:
 *   put:
 *     security: 
 *         - BearerAuth: []
 *     summary: Update booking by id
 *     tags: [Booking-Detail]
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
 * /api/v1/booking-details/{bookingId}:
 *   delete:
 *     security: 
 *         - BearerAuth: []
 *     summary: Delete booking by id
 *     tags: [Booking-Detail]
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
