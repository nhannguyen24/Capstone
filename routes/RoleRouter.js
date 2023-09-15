const controllers = require('../controllers/RoleController');
const express = require('express');
const verifyToken = require('../middlewares/VerifyToken');
const {isAdmin} = require('../middlewares/VerifyRole');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Role:
 *       type: object
 *       required:
 *       properties:
 *         roleId:
 *           type: string
 *           description: The auto-generated id of the role
 *         roleName:
 *           type: string
 *           description: The role name
 *         status:
 *           type: string
 *           description: The role status("Active", "Deactive")
 */

/**
 * @swagger
 * /api/v1/roles:
 *   get:
 *     security: 
 *         - BearerAuth: []
 *     summary: Returns the list of all the roles
 *     tags: [Role]
 *     parameters:
 *       - name: roleName
 *         in: query
 *         schema:
 *           type: string
 *         description: Find role by roleName
 *     responses:
 *       200:
 *         description: Get the list of the roles successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Role'
 */
router.get("/", verifyToken, isAdmin, controllers.getAllRoles);

module.exports = router;
