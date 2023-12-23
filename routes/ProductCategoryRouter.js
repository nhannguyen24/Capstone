// const controllers = require('../controllers/ProductCategoryController');
// const express = require('express');
// const verifyToken = require('../middlewares/VerifyToken');
// const router = express.Router();
// const {roleAuthen} = require('../middlewares/VerifyRole');

// /**
//  * @swagger
//  * components:
//  *   schemas:
//  *     ProductCategory:
//  *       type: object
//  *       required:
//  *       properties:
//  *         productCateId:
//  *           type: string
//  *           description: The auto-generated id of the productCate
//  *         productCateName:
//  *           type: string
//  *           description: The productCate name
//  *         status:
//  *           type: string
//  *           description: The productCate status('Active', 'Deactive')
//  */

// /**
//  * @swagger
//  * /api/v1/productCates:
//  *   get:
//  *     security: 
//  *         - BearerAuth: []
//  *     summary: Returns the list of all the productCates
//  *     tags: [ProductCategory]
//  *     parameters:
//  *       - name: productCateName
//  *         in: query
//  *         schema:
//  *           type: string
//  *         description: Find productCate by productCateName
//  *       - name: status
//  *         in: query
//  *         schema:
//  *           type: string
//  *           enum: ["Active", "Deactive"]
//  *         description: Find productCate by status
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
//  *         description: Sort by (productCateName/createdAt)
//  *       - name: order[1]
//  *         in: query
//  *         schema:
//  *           type: string
//  *         description: Sort ASC/DESC
//  *     responses:
//  *       200:
//  *         description: Get the list of the productCates successfully
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: array
//  *               items:
//  *                 $ref: '#/components/schemas/ProductCategory'
//  */
// router.get("/", verifyToken, controllers.getAllProductCategory);

// /**
//  * @swagger
//  * /api/v1/productCates/{id}:
//  *   get:
//  *     security: 
//  *         - BearerAuth: []
//  *     summary: Returns the the productCates by id
//  *     tags: [ProductCategory]
//  *     parameters:
//  *       - name: id
//  *         in: path
//  *         schema:
//  *           type: string
//  *         description: Find productCate by productCateId
//  *     responses:
//  *       200:
//  *         description: Get the productCate by id successfully
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: array
//  *               items:
//  *                 $ref: '#/components/schemas/ProductCategory'
//  */
// router.get("/:id", verifyToken, controllers.getProductCategoryById);

// /**
//  * @swagger
//  * /api/v1/productCates:
//  *   post:
//  *     security:
//  *       - BearerAuth: []
//  *     summary: Create new productCate
//  *     tags: [ProductCategory]
//  *     requestBody:
//  *        required: true
//  *        content:
//  *          application/json:
//  *            schema:
//  *              $ref: '#/components/schemas/ProductCategory'
//  *            example:
//  *              productCateName: Thức ăn
//  *     responses:
//  *       200:
//  *         description: Create new productCate successfully
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: array
//  *               items:
//  *                 $ref: '#/components/schemas/ProductCategory'
//  */
// router.post("/", verifyToken, roleAuthen(["Manager"]), controllers.createProductCategory);

// /**
//  * @swagger
//  * /api/v1/productCates/{id}:
//  *   put:
//  *     security: 
//  *         - BearerAuth: []
//  *     summary: Update the productCate by id
//  *     tags: [ProductCategory]
//  *     parameters:
//  *       - in: path
//  *         name: id
//  *         schema:
//  *           type: string
//  *         required: true
//  *         description: Update product category by productCateId
//  *     requestBody:
//  *       content:
//  *          application/json:
//  *            schema:
//  *              $ref: '#/components/schemas/ProductCategory'
//  *            example:
//  *              productCateName: Thức ăn
//  *              status: Active
//  *     responses:
//  *       200:
//  *         description: Update the productCate successfully
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: array
//  *               items:
//  *                 $ref: '#/components/schemas/ProductCategory'
//  */
// router.put("/:id", verifyToken, roleAuthen(["Manager"]), controllers.updateProductCategory);

// /**
//  * @swagger
//  * /api/v1/productCates/{id}:
//  *   delete:
//  *     security: 
//  *         - BearerAuth: []
//  *     summary: Delete the productCates by id
//  *     tags: [ProductCategory]
//  *     parameters:
//  *       - name: id
//  *         in: path
//  *         schema:
//  *           type: string
//  *         description: Input productCateId to delete
//  *     responses:
//  *       200:
//  *         description: Delete the productCates by id successfully
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: array
//  *               items:
//  *                 $ref: '#/components/schemas/ProductCategory'
//  */
// router.delete("/:id", verifyToken, roleAuthen(["Manager"]), controllers.deleteProductCategory);

// module.exports = router;
