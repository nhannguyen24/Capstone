const services = require('../services/ProductService');
const {BadRequestError, InternalServerError} = require('../errors/Index');

const getAllProduct = async (req, res) => {
    try {
        const { roleName } = req.user;
        const response = await services.getAllProduct(req.query, roleName);
        return res.status(response.status).json(response.data);
    } catch (error) {
        throw new InternalServerError(error);
    }
};

const getProductById = async (req, res) => {
    try {
        const { id: productId } = req.params;
        if(!productId) {
            throw new BadRequestError('Please provide productId');
        }
        const response = await services.getProductById(productId);
        return res.status(response.status).json(response.data);
    } catch (error) {
        console.log(error);
        throw new InternalServerError(error.message);
    }
};

const createProduct = async (req, res) => {
    try {
        const {productName} = req.body;
        if(!productName) {
            throw new BadRequestError('Please provide productName');
        }
        const response = await services.createProduct(req.body);
        return res.status(response.status).json(response.data);
    } catch (error) {
        console.log(error);
        throw new InternalServerError(error);
    }
};

const updateProduct = async (req, res) => {
    try {
        const {id} = req.params;
        if(!id) {
            throw new BadRequestError('Please provide id');
        }
        const response = await services.updateProduct(id, req.body);
        return res.status(response.status).json(response.data);
    } catch (error) {
        throw new InternalServerError(error);
    }
};

const deleteProduct = async (req, res) => {
    try {
        const {id} = req.params;
        if(!id) {
            throw new BadRequestError('Please provide id');
        }
        const response = await services.deleteProduct(id);
        return res.status(response.status).json(response.data);
    } catch (error) {
        console.log(error);
        throw new InternalServerError(error);
    }
};

module.exports = {getAllProduct, createProduct, updateProduct, deleteProduct, getProductById};
