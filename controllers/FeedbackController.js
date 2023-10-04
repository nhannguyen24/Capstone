// const services = require('../services/FeedbackService');
// const {BadRequestError, InternalServerError} = require('../errors/Index');

// const getFeedbacks = async (req, res) => {
//     try {
//         const response = await services.getFeedbacks(req);
//         return res.status(response.status).json(response.data);
//     } catch (error) {
//         throw new InternalServerError(error);
//     }
// };
// const getFeedbacksByTourId = async (req, res) => {
//     try {
//         const response = await services.getFeedbacksByTourId(req);
//         return res.status(response.status).json(response.data);
//     } catch (error) {
//         throw new InternalServerError(error);
//     }
// };

// const createFeedback = async (req, res) => {
//     try {
//         const response = await services.createFeedback(req);
//         return res.status(response.status).json(response.data);
//     } catch (error) {
//         throw new InternalServerError(error);
//     }
// }

// const updateFeedback = async (req, res) => {
//     try {
//         const response = await services.updateFeedback(req);
//         return res.status(response.status).json(response.data);
//     } catch (error) {
//         throw new InternalServerError(error);
//     }
// }
// const deleteFeedback = async (req, res) => {
//     try {
//         const response = await services.deleteFeedback(req);
//         return res.status(response.status).json(response.data);
//     } catch (error) {
//         throw new InternalServerError(error);
//     }
// }

// module.exports = { getFeedbacks, getFeedbacksByTourId, createFeedback, updateFeedback, deleteFeedback }