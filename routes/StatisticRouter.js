const controllers = require('../controllers/StatisticController');
const express = require('express');
const verifyToken = require('../middlewares/VerifyToken');
const { roleAuthen } = require('../middlewares/VerifyRole');

const router = express.Router();

/**
 * @swagger
 * /api/v1/statistics:
 *   get:
 *     security: 
 *         - BearerAuth: []
 *     summary: Get statictics
 *     tags: [Statistic]
 *     parameters:
 *      - in: query
 *        name: startDate
 *        schema:
 *          type: string
 *        exammple: 2023-11-27
 *      - in: query
 *        name: endDate
 *        schema:
 *          type: string
 *        exammple: 2023-11-30
 *      - in: query
 *        name: periodicity
 *        schema:
 *          type: string
 *          enum:
 *              - Weekly
 *              - Monthly
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example: {
 *                  msg: "Get statistic successfully",
 *                  booking_statistic: {
 *                      totalBookedTickets: 1,
 *                      totalCancelTickets: 1,
 *                      totalMoneyEarned: 20000,
 *                      totalBusSeat: 10
 *                  },
 *                  tour_statistic: {
 *                      totalCreatedTour: 1,
 *                      totalCancelTour: 1,
 *                      totalAvailableTours: 1,
 *                      totalFinishedTours: 1   
 *                  },
 *                  tours: []
 *               }
 */
router.get("/", verifyToken, roleAuthen(["Manager", "Admin"]), controllers.getStatistics);
//  *      - in: query
//  *        name: bookingStatus
//  *        schema:
//  *          type: array
//  *          items: 
//  *              type: string
//  *        style: form
//  *        explode: false
//  *        description: "Allowed values: Ongoing, Canceled, Finished"

module.exports = router;
