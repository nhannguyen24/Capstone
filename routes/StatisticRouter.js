const controllers = require('../controllers/StatisticController');
const express = require('express');
const verifyToken = require('../middlewares/VerifyToken');
const {roleAuthen} = require('../middlewares/VerifyRole');

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
 *        exammple: 2023-11-01
 *      - in: query
 *        name: endDate
 *        schema:
 *          type: string
 *        exammple: 2023-11-05
 *      - in: query
 *        name: routeId
 *        schema:
 *          type: string
 *      - in: query
 *        name: bookingStatus
 *        schema:
 *          type: array
 *          items: 
 *              type: string
 *        style: form
 *        explode: false
 *        description: "Allowed values: Ongoing, Canceled, Finished"
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example: {
 *                  msg: "Get statistic successfully",
 *                  totalBookedTickets: 1,
 *                  totalCancelTickets: 1,
 *                  totalMoneyEarned: 1,
 *                  totalCreatedTour: 1,
 *                  totalCancelTour: 1,
 *               }
 */
router.get("/",  verifyToken, roleAuthen(["Manager"]), controllers.getStatistics);
/*
 *      - in: query
 *        name: tourStatus
 *        schema:
 *          type: array
 *          items: 
 *              type: string
 *        style: form
 *        explode: false
 *        description: "Allowed values: Available, Started, Canceled, Finished"
 *      - in: query
 *        name: time
 *        schema:
 *          type: string
 */
module.exports = router;
