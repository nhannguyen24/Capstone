const controllers = require('../controllers/AuthController');
const express = require('express');
const firebaseAuth = require('../middlewares/VerifyFirebaseToken');
const router = express.Router();
const verifyToken = require('../middlewares/VerifyToken');

/**
 * @swagger
 * components:
 *   schemas:
 *     Token:
 *       type: object
 *       properties:
 *         refreshToken:
 *           type: String
 *           description: The auto-generated token
 */

/**
 * @swagger
 * /api/v1/auth/login-google:
 *   post:
 *     summary: For login with google returns the token
 *     security: 
 *         - BearerAuth: []
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Login with google returns the token successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 */
router.post('/login-google', firebaseAuth, controllers.loginGoogle);

/**
 * @swagger
 * /api/v1/auth/refresh-token:
 *   post:
 *     summary: For refresh new token
 *     security: 
 *         - BearerAuth: []
 *     tags: [Auth]
 *     requestBody:
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/Token'
 *            example:
 *              refreshToken: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdHVkZW50X2lkIjoiVjJzU0MxSFNMQVNOdFRUMFJoendxRHh4d3JpMiIsImlhdCI6MTY3NjgyOTMzMiwiZXhwIjoxNjc3MjYxMzMyfQ.8LfwVJoW5hPcw1rR9-sOWlhQBT83xhQAYJXFUAE2Z9k
 *     responses:
 *       200:
 *         description: Refresh new token successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 */
router.post('/refresh-token', controllers.refreshAccessToken);


/**
 * @swagger
 * /api/v1/auth/logout:
 *   post:
 *     summary: For logout
 *     security: 
 *         - BearerAuth: []
 *     tags: [Auth]
 *     parameters:
 *       - name: userId
 *         in: query
 *         schema:
 *           type: string
 *         description: Input userId to logout
 *     responses:
 *       200:
 *         description: Logout successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 */
router.post('/logout', verifyToken, controllers.logout);

/**
 * @swagger
 * components:
 *   schemas:
 *     User-login:
 *       type: object
 *       properties:
 *         email:
 *           type: String
 *           description: User email
 *         password:
 *           type: String
 *           description: User password
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     User-register:
 *       type: object
 *       properties:
 *         email:
 *           type: String
 *           description: User email
 *         password:
 *           type: String
 *           description: User password
 *         confirm_pass:
 *           type: String
 *           description: User confirm_pass
 */

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: For login 
 *     tags: [Auth]
 *     requestBody:
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/User-login'
 *            example:
 *              email: dnhan2426@gmail.com
 *              password: "123456"
 *     responses:
 *       200:
 *         description: Login successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 */
router.post('/login', controllers.login);

/**
 * @swagger
 * /api/v1/auth/register:
 *   post:
 *     summary: For register new account
 *     tags: [Auth]
 *     requestBody:
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/User-register'
 *            example:
 *              email: dnhan2426@gmail.com
 *              password: "123456"
 *              confirmPass: "123456"
 *     responses:
 *       200:
 *         description: Register new account successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 */
router.post('/register', controllers.register);

module.exports = router;
