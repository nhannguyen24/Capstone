const services = require('../services/ProductCategoryService');
const {BadRequestError, InternalServerError} = require('../errors/Index');

const getAllProductCategory = async (req, res) => {
    try {
        const { roleName } = req.user;
        const response = await services.getAllProductCategory(req.query, roleName);
        return res.status(response.status).json(response.data);
    } catch (error) {
        throw new InternalServerError(error);
    }
};

const getProductCategoryById = async (req, res) => {
    try {
        const { id: productCateId } = req.params;
        if(!productCateId) {
            throw new BadRequestError('Please provide productCateId');
        }
        const response = await services.getProductCategoryById(productCateId);
        return res.status(response.status).json(response.data);
    } catch (error) {
        console.log(error);
        throw new InternalServerError(error.message);
    }
};

const createProductCategory = async (req, res) => {
    try {
        const {productCateName} = req.body;
        if(!productCateName) {
            throw new BadRequestError('Please provide productCateName');
        }
        const response = await services.createProductCategory(req.body);
        return res.status(response.status).json(response.data);
    } catch (error) {
        console.log(error);
        throw new InternalServerError(error);
    }
};

const updateProductCategory = async (req, res) => {
    try {
        const {productCateId} = req.body;
        if(!productCateId) {
            throw new BadRequestError('Please provide productCateId');
        }
        const response = await services.updateProductCategory(req.body);
        return res.status(response.status).json(response.data);
    } catch (error) {
        throw new InternalServerError(error);
    }
};

const deleteProductCategory = async (req, res) => {
    try {
        const {productCateIds} = req.query;
        if(!productCateIds) {
            throw new BadRequestError('Please provide productCateIds');
        }
        const response = await services.deleteProductCategory(req.query.productCateIds);
        return res.status(response.status).json(response.data);
    } catch (error) {
        console.log(error);
        throw new InternalServerError(error);
    }
};

module.exports = {getAllProductCategory, createProductCategory, updateProductCategory, deleteProductCategory, getProductCategoryById};
