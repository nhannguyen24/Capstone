const controllers = require('../controllers/RouteController');
const express = require('express');
const verifyToken = require('../middlewares/VerifyToken');
const router = express.Router();
const {isAdminOrManager} = require('../middlewares/VerifyRole');

/**
 * @swagger
 * components:
 *   schemas:
 *     Route:
 *       type: object
 *       required:
 *       properties:
 *         routeId:
 *           type: string
 *           description: The auto-generated id of the route
 *         routeName:
 *           type: string
 *           description: The route name
 *         status:
 *           type: string
 *           description: The route status('Active', 'Deactive')
 */

/**
 * @swagger
 * /api/v1/routes:
 *   get:
 *     security: 
 *         - BearerAuth: []
 *     summary: Returns the list of all the routes
 *     tags: [Route]
 *     parameters:
 *       - name: routeName
 *         in: query
 *         schema:
 *           type: string
 *         description: Find route by routeName
 *       - name: status
 *         in: query
 *         schema:
 *           type: string
 *           enum: ["Active", "Deactive"]
 *         description: Find route by status
 *       - name: page
 *         in: query
 *         schema:
 *           type: int
 *         description: Paging page number
 *       - name: limit
 *         in: query
 *         schema:
 *           type: int
 *         description: Paging limit row to get in 1 page
 *       - name: order[0]
 *         in: query
 *         schema:
 *           type: string
 *         description: Sort by (routeName/createdAt)
 *       - name: order[1]
 *         in: query
 *         schema:
 *           type: string
 *         description: Sort ASC/DESC
 *     responses:
 *       200:
 *         description: Get the list of the routes successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Route'
 */
router.get("/", verifyToken, controllers.getAllRoute);

/**
 * @swagger
 * /api/v1/routes/{id}:
 *   get:
 *     security: 
 *         - BearerAuth: []
 *     summary: Returns the the routes by id
 *     tags: [Route]
 *     parameters:
 *       - name: id
 *         in: path
 *         schema:
 *           type: string
 *         description: Find route by routeId
 *     responses:
 *       200:
 *         description: Get the route by id successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Route'
 */
router.get("/:id", verifyToken, controllers.getRouteById);

/**
 * @swagger
 * /api/v1/routes:
 *   post:
 *     security:
 *       - BearerAuth: []
 *     summary: Create new route
 *     tags: [Route]
 *     requestBody:
 *       content:
 *          application/json:
 *            schema:                     
 *                  example:
 *                    routeName: Tuyến đường Nha Trang
 *                    distance: 10.5
 *                    segments:
 *                          - departureStationId: stationId
 *                            endStationId: stationId
 *                            geoJson:
 *                                   type: Feature
 *                                   geometry: 
 *                                          type: LineString
 *                                          coordinates: 
 *                                                - [departureLongitude, departureLatitude]
 *                                                - [waypoint1Longitude, waypoint1Latitude]
 *                                                - [waypoint2Longitude, waypoint2Latitude]
 *                                                - [endLongitude, endLatitude]
 *                                   properties: 
 *                                          name: Route between Stations
 *                            points:
 *                                  - poiId
 *                                  - poiId
 *                          - departureStationId: stationId
 *                            endStationId: stationId
 *                            geoJson:
 *                                   type: Feature
 *                                   geometry: 
 *                                          type: LineString
 *                                          coordinates: 
 *                                                - [departureLongitude, departureLatitude]
 *                                                - [waypoint1Longitude, waypoint1Latitude]
 *                                                - [waypoint2Longitude, waypoint2Latitude]
 *                                                - [endLongitude, endLatitude]
 *                                   properties: 
 *                                          name: Route between Stations
 *                            points:
 *                                  - poiId
 *                                  - poiId
 *     responses:
 *       200:
 *         description: Create new route successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Route'
 */
router.post("/", verifyToken, isAdminOrManager, controllers.createRoute);

/**
 * @swagger
 * /api/v1/routes:
 *   put:
 *     security: 
 *         - BearerAuth: []
 *     summary: Update the route by id
 *     tags: [Route]
 *     requestBody:
 *       content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/Route'
 *            example:
 *              routeId: 8c382e13-8620-460a-bd95-96b1152c1368
 *              routeName: Tuyến đường Nha Trang
 *              status: Active
 *     responses:
 *       200:
 *         description: Update the route successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Route'
 */
router.put("/", verifyToken, isAdminOrManager, controllers.updateRoute);

/**
 * @swagger
 * /api/v1/routes:
 *   delete:
 *     security: 
 *         - BearerAuth: []
 *     summary: Delete the routes by id
 *     tags: [Route]
 *     parameters:
 *       - name: routeIds[0]
 *         in: query
 *         schema:
 *           type: string
 *         description: Input routeId to delete
 *     responses:
 *       200:
 *         description: Delete the routes by id successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Route'
 */
router.delete("/", verifyToken, isAdminOrManager, controllers.deleteRoute);

module.exports = router;
