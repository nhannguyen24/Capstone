const controllers = require('../controllers/StatisticController');
const express = require('express');

const router = express.Router();

/**
 * @swagger
 * /api/v1/statistics:
 *   get:
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
 */
router.get("/", controllers.getStatistics);
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
