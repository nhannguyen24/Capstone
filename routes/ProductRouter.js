const controllers = require('../controllers/ProductController');
const express = require('express');
const verifyToken = require('../middlewares/VerifyToken');
const router = express.Router();
const {isAdminOrManager} = require('../middlewares/VerifyRole');

/**
 * @swagger
 * components:
 *   schemas:
 *     Product:
 *       type: object
 *       required:
 *       properties:
 *         productId:
 *           type: string
 *           description: The auto-generated id of the product
 *         productName:
 *           type: string
 *           description: The product name
 *         price:
 *           type: number
 *           description: The product price
 *         productCateId:
 *           type: string
 *           description: The product category id
 *         status:
 *           type: string
 *           description: The product status('Active', 'Deactive')
 */

/**
 * @swagger
 * /api/v1/products:
 *   get:
 *     security: 
 *         - BearerAuth: []
 *     summary: Returns the list of all the products
 *     tags: [Product]
 *     parameters:
 *       - name: productName
 *         in: query
 *         schema:
 *           type: string
 *         description: Find product by productName
 *       - name: productCateId
 *         in: query
 *         schema:
 *           type: string
 *         description: Find product by productCateId
 *       - name: status
 *         in: query
 *         schema:
 *           type: string
 *           enum: ["Active", "Deactive"]
 *         description: Find product by status
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
 *         description: Sort by (productName/createdAt)
 *       - name: order[1]
 *         in: query
 *         schema:
 *           type: string
 *         description: Sort ASC/DESC
 *     responses:
 *       200:
 *         description: Get the list of the products successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 */
router.get("/", verifyToken, controllers.getAllProduct);

/**
 * @swagger
 * /api/v1/products/{id}:
 *   get:
 *     security: 
 *         - BearerAuth: []
 *     summary: Returns the the products by id
 *     tags: [Product]
 *     parameters:
 *       - name: id
 *         in: path
 *         schema:
 *           type: string
 *         description: Find product by productId
 *     responses:
 *       200:
 *         description: Get the product by id successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 */
router.get("/:id", verifyToken, controllers.getProductById);

/**
 * @swagger
 * /api/v1/products:
 *   post:
 *     security:
 *       - BearerAuth: []
 *     summary: Create new product
 *     tags: [Product]
 *     requestBody:
 *       content:
 *          application/json:
 *            schema:                     
 *                  example:
 *                    productName: Bánh mì
 *                    price: 10000
 *                    productCateId: 1aaaeb7d-8671-4987-aa0b-7fdc8c9d192e
 *                    images:
 *                          - string
 *                          - string
 *     responses:
 *       200:
 *         description: Create new product successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 */
router.post("/", verifyToken, isAdminOrManager, controllers.createProduct);

/**
 * @swagger
 * /api/v1/products:
 *   put:
 *     security: 
 *         - BearerAuth: []
 *     summary: Update the product by id
 *     tags: [Product]
 *     requestBody:
 *       content:
 *          application/json:
 *            schema:                     
 *                  example:
 *                    productId: 8c382e13-8620-460a-bd95-96b1152c1368
 *                    productName: Bánh mì
 *                    price: 10000
 *                    productCateId: 1aaaeb7d-8671-4987-aa0b-7fdc8c9d192e
 *                    images:
 *                          - string
 *                          - string
 *                    status: Active
 *     responses:
 *       200:
 *         description: Update the product successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 */
router.put("/", verifyToken, isAdminOrManager, controllers.updateProduct);

/**
 * @swagger
 * /api/v1/products:
 *   delete:
 *     security: 
 *         - BearerAuth: []
 *     summary: Delete the products by id
 *     tags: [Product]
 *     parameters:
 *       - name: productId
 *         in: query
 *         schema:
 *           type: string
 *         description: Input productId to delete
 *     responses:
 *       200:
 *         description: Delete the products by id successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 */
router.delete("/", verifyToken, isAdminOrManager, controllers.deleteProduct);

module.exports = router;
