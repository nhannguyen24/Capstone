// const controllers = require('../controllers/RouteController');
// const express = require('express');
// const verifyToken = require('../middlewares/VerifyToken');
// const router = express.Router();
// const {roleAuthen} = require('../middlewares/VerifyRole');

// /**
//  * @swagger
//  * components:
//  *   schemas:
//  *     Route:
//  *       type: object
//  *       required:
//  *       properties:
//  *         routeId:
//  *           type: string
//  *           description: The auto-generated id of the route
//  *         routeName:
//  *           type: string
//  *           description: The route name
//  *         status:
//  *           type: string
//  *           description: The route status('Active', 'Deactive')
//  */

// /**
//  * @swagger
//  * /api/v1/routes:
//  *   get:
//  *     security: 
//  *         - BearerAuth: []
//  *     summary: Returns the list of all the routes
//  *     tags: [Route]
//  *     parameters:
//  *       - name: routeName
//  *         in: query
//  *         schema:
//  *           type: string
//  *         description: Find route by routeName
//  *       - name: tour
//  *         in: query
//  *         schema:
//  *           type: boolean
//  *         description: Print route with tour
//  *       - name: status
//  *         in: query
//  *         schema:
//  *           type: string
//  *           enum: ["Active", "Deactive"]
//  *         description: Find route by status
//  *       - name: page
//  *         in: query
//  *         schema:
//  *           type: int
//  *         description: Paging page number
//  *       - name: limit
//  *         in: query
//  *         schema:
//  *           type: int
//  *         description: Paging limit row to get in 1 page
//  *       - name: order[0]
//  *         in: query
//  *         schema:
//  *           type: string
//  *         description: Sort by (routeName/createdAt)
//  *       - name: order[1]
//  *         in: query
//  *         schema:
//  *           type: string
//  *         description: Sort ASC/DESC
//  *     responses:
//  *       200:
//  *         description: Get the list of the routes successfully
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: array
//  *               items:
//  *                 $ref: '#/components/schemas/Route'
//  */
// router.get("/", verifyToken, controllers.getAllRoute);

// /**
//  * @swagger
//  * /api/v1/routes/{id}:
//  *   get:
//  *     security: 
//  *         - BearerAuth: []
//  *     summary: Returns the the routes by id
//  *     tags: [Route]
//  *     parameters:
//  *       - name: id
//  *         in: path
//  *         schema:
//  *           type: string
//  *         description: Find route by routeId
//  *     responses:
//  *       200:
//  *         description: Get the route by id successfully
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: array
//  *               items:
//  *                 $ref: '#/components/schemas/Route'
//  */
// router.get("/:id", controllers.getRouteById);

// /**
//  * @swagger
//  * /api/v1/routes:
//  *   post:
//  *     security:
//  *       - BearerAuth: []
//  *     summary: Create new route
//  *     tags: [Route]
//  *     requestBody:
//  *       content:
//  *          application/json:
//  *            schema:                     
//  *                  example:
//  *                    routeName: Tuyến đường Nha Trang
//  *                    distance: 10.5
//  *                    geoJson:
//  *                           type: Feature
//  *                           geometry: 
//  *                                  type: LineString
//  *                                  coordinates: 
//  *                                        - [departureLongitude, departureLatitude]
//  *                                        - [waypoint1Longitude, waypoint1Latitude]
//  *                                        - [waypoint2Longitude, waypoint2Latitude]
//  *                                        - [endLongitude, endLatitude]
//  *                           properties: 
//  *                                  name: Route between Stations
//  *                    segments:
//  *                          - departureStationId: stationId
//  *                            endStationId: stationId
//  *                            distance: 100.2
//  *                            points:
//  *                                  - poiId
//  *                                  - poiId
//  *                          - departureStationId: stationId
//  *                            endStationId: stationId
//  *                            distance: 410.3
//  *                            points:
//  *                                  - poiId
//  *                                  - poiId
//  *     responses:
//  *       200:
//  *         description: Create new route successfully
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: array
//  *               items:
//  *                 $ref: '#/components/schemas/Route'
//  */
// router.post("/", verifyToken, roleAuthen(["Manager"]), controllers.createRoute);

// /**
//  * @swagger
//  * /api/v1/routes/{id}:
//  *   put:
//  *     security: 
//  *         - BearerAuth: []
//  *     summary: Update the route by id
//  *     tags: [Route]
//  *     parameters:
//  *       - in: path
//  *         name: id
//  *         schema:
//  *           type: string
//  *         required: true
//  *         description: Update route by routeId
//  *     requestBody:
//  *       content:
//  *          application/json:
//  *            schema:
//  *              $ref: '#/components/schemas/Route'
//  *            example:
//  *              routeName: Tuyến đường Nha Trang
//  *              status: Active
//  *     responses:
//  *       200:
//  *         description: Update the route successfully
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: array
//  *               items:
//  *                 $ref: '#/components/schemas/Route'
//  */
// router.put("/:id", verifyToken, roleAuthen(["Manager"]), controllers.updateRoute);

// /**
//  * @swagger
//  * /api/v1/routes/{id}:
//  *   delete:
//  *     security: 
//  *         - BearerAuth: []
//  *     summary: Delete the routes by id
//  *     tags: [Route]
//  *     parameters:
//  *       - name: id
//  *         in: path
//  *         schema:
//  *           type: string
//  *         description: Input routeId to delete
//  *     responses:
//  *       200:
//  *         description: Delete the routes by id successfully
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: array
//  *               items:
//  *                 $ref: '#/components/schemas/Route'
//  */
// router.delete("/:id", verifyToken, roleAuthen(["Manager"]), controllers.deleteRoute);

// module.exports = router;
