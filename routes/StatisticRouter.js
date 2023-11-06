const controllers = require('../controllers/StatisticController');
const express = require('express');

const router = express.Router();

/**
 * @swagger
 * /api/v1/statistics:
 *   get:
 *     summary: Get statictics
 *     tags: [Payment]
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
router.get("/", controllers.getStatistics);

module.exports = router;
