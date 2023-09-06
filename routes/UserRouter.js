const controllers = require('../controllers/UserController');
const express = require('express');
const verifyToken = require('../middlewares/VerifyToken');
const {isAdmin} = require('../middlewares/VerifyRole');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - userId
 *         - userName
 *       properties:
 *         userId:
 *           type: string
 *           description: The auto-generated id of the user
 *         userName:
 *           type: string
 *           description: The user name
 *         email:
 *           type: string
 *           description: The user email
 *         avatar:
 *           type: string
 *           description: The user avatar
 *         status:
 *           type: string
 *           description: The user status("Active", "Deactive")
 *       example:
 *         userId: V2sSC1HSLASNtTT0RhzwqDxxwri2
 *         userName: Nhan Nguyen
 *         email: dnhan2426@gmail.com
 *         avatar: https://lh3.googleusercontent.com/a/AEdFTp4508ZdzGjVRFFIwb0ULZXYm5V5_vyRsiKq-cfA=s96-c
 *         address: D1 
 *         birthday: 11-08-2000
 *         phone: 089x
 *         role: Admin
 */

// /**
//  * @swagger
//  * /api/v1/users:
//  *   get:
//  *     security: 
//  *         - BearerAuth: []
//  *     summary: Returns the list of all the users
//  *     tags: [user-controller]
//  *     responses:
//  *       200:
//  *         description: Get the list of the users successfully
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: array
//  *               items:
//  *                 $ref: '#/components/schemas/User'
//  */
// router.get("/", verifyToken, verifyRole, controllers.getAllUser);

/**
 * @swagger
 * /api/v1/users:
 *   get:
 *     security: 
 *         - BearerAuth: []
 *     summary: Returns the list of all the users paging
 *     tags: [user-controller]
 *     parameters:
 *       - name: userName
 *         in: query
 *         schema:
 *           type: string
 *         description: Find user by userName
 *       - name: userId
 *         in: query
 *         schema:
 *           type: string
 *         description: Find user by userId
 *       - name: email
 *         in: query
 *         schema:
 *           type: string
 *         description: Find user by email
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
 *         description: Sort by (userName/createdAt)
 *       - name: order[1]
 *         in: query
 *         schema:
 *           type: string
 *         description: Sort ASC/DESC
 *     responses:
 *       200:
 *         description: Get the list of the users paging successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 */
router.get("/", verifyToken, isAdmin, controllers.getAllUsers);

// /**
//  * @swagger
//  * /api/v1/users/{id}:
//  *   get:
//  *     security: 
//  *         - BearerAuth: []
//  *     summary: Returns the the users by id
//  *     tags: [user-controller]
//  *     parameters:
//  *       - name: id
//  *         in: path
//  *         schema:
//  *           type: string
//  *         description: Find user by userId
//  *     responses:
//  *       200:
//  *         description: Get the users by id successfully
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: array
//  *               items:
//  *                 $ref: '#/components/schemas/User'
//  */
// router.get("/:id", verifyToken, controllers.getUserById);

/**
 * @swagger
 * /api/v1/users:
 *   post:
 *     security: 
 *         - BearerAuth: []
 *     summary: Create new user
 *     tags: [user-controller]
 *     requestBody:
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/User'
 *            example:
 *              userName: Nhan
 *              email: abc@gmail.com
 *              password: "123123"
 *              roleId: 58c10546-5d71-47a6-842e-84f5d2f72ec3
 *     responses:
 *       200:
 *         description: Create new users successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 */
router.post("/", verifyToken, isAdmin, controllers.createUser);

/**
 * @swagger
 * /api/v1/users:
 *   put:
 *     security: 
 *         - BearerAuth: []
 *     summary: Update the user by id
 *     tags: [user-controller]
 *     requestBody:
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/User'
 *            example:
 *              userId: 0453b1d5-b5cb-4ae3-ac95-8d5c24cb8093
 *              userName: Nhan Nguyen
 *              avatar: https://lh3.googleusercontent.com/a/AEdFTp4508ZdzGjVRFFIwb0ULZXYm5V5_vyRsiKq-cfA=s96-c
 *              birthday: 2003-03-18 
 *              phone: "0898149847"
 *              address: 1/1 D1 HCM
 *              roleId: 58c10546-5d71-47a6-842e-84f5d2f72ec3
 *              status: Active
 *     responses:
 *       200:
 *         description: Update the user successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 */
router.put("/", verifyToken, isAdmin, controllers.updateUser);

/**
 * @swagger
 * /api/v1/users/profile:
 *   put:
 *     security: 
 *         - BearerAuth: []
 *     summary: Update the profile
 *     tags: [user-controller]
 *     requestBody:
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/User'
 *            example:
 *              userId: V2sSC1HSLASNtTT0RhzwqDxxwri2
 *              userName: Nhan Nguyen
 *              avatar: https://lh3.googleusercontent.com/a/AEdFTp4508ZdzGjVRFFIwb0ULZXYm5V5_vyRsiKq-cfA=s96-c
 *              birthday: 2003-03-18 
 *              phone: "0898149847"
 *              address: 1/1 D1 HCM
 *     responses:
 *       200:
 *         description: Update profile successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 */
router.put("/profile/", verifyToken, controllers.updateProfile);

/**
 * @swagger
 * /api/v1/users/delete:
 *   delete:
 *     security: 
 *         - BearerAuth: []
 *     summary: Delete the users by id
 *     tags: [user-controller]
 *     parameters:
 *       - name: userIds[0]
 *         in: query
 *         schema:
 *           type: string
 *         description: Input userId to delete
 *     responses:
 *       200:
 *         description: Delete the user by id successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 */
router.delete("/delete", verifyToken, isAdmin, controllers.deleteUser);

module.exports = router;
