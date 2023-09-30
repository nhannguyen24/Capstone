const db = require('../models');
const { Op, sequelize } = require('sequelize');
const STATUS = require("../enums/StatusEnum")
const TOUR_STATUS = require("../enums/TourStatusEnum")

const getFeedbacks = (req) => new Promise(async (resolve, reject) => {
    try {
        const feedbacks = await db.FeedBack.findAll({
            order: [
                ["updatedAt", "DESC"]
            ],
        });

        resolve({
            status: 200,
            data: {
                msg: `Get list of feedbacks successfully`,
                feedbacks: feedbacks
            }
        });

    } catch (error) {
        reject(error);
    }
});

const getFeedbacksByTourId = (req) => new Promise(async (resolve, reject) => {
    try {
        const tourId = req.params.tourId
        const feedbacks = await db.FeedBack.findAll({
            where: {
                tourId: tourId
            },

            attributes: [
                [sequelize.fn('AVG', sequelize.col('stars')), 'avgStars']
            ],
            include: [
                {
                    model: db.User,
                    as: "feedback_user",
                    attribute: {
                        exclude: ["email", "password", "birthday", "avatar", "address", "phone", "accessChangePassword", "refreshToken", "roleId"]
                    }
                },
            ],
        });

        const averageStars = feedbacks.length > 0 ? feedbacks[0].dataValues.avgStars : null;

        resolve({
            status: feedbacks.length > 0 ? 200 : 404,
            data: feedbacks.length > 0 ? {
                msg: `Get feedbacks successfully`,
                averageStars: averageStars,
                feedbacks: feedbacks
            } : {
                msg: `No feedbacks found with tourId: "${tourId}"`,
            }
        });

    } catch (error) {
        reject(error);
    }
});

const createFeedback = (req) => new Promise(async (resolve, reject) => {
    try {
        const customerId = req.body.customerId
        const tourId = req.body.tourId
        const stars = req.body.stars
        const description = req.body.description

        //check user
        const user = await db.User.findOne({
            where: {
                userId: customerId
            }
        })

        if (!user) {
            resolve({
                status: 404,
                data: {
                    msg: `User not found with id: "${customerId}",`
                }
            })
            return
        }

        //check tour
        const tour = await db.Tour.findOne({
            where: {
                tourId: tourId
            }
        })

        if (!tour) {
            resolve({
                status: 404,
                data: {
                    msg: `Tour not found with id: "${tourId}",`
                }
            })
            return
        }

        //Check if the user has gone on a tour
        const isGoneOnTour = await db.BookingDetail.findOne({
            include: [
                {
                    model: db.Ticket,
                    as: "booking_detail_ticket",
                    where: {
                        tourId: tourId,
                    },
                    include: [
                        {
                            model: db.Tour,
                            as: "ticket_tour",
                            where: {
                                tourStatus: TOUR_STATUS.FINISHED,
                            },
                        }
                    ]
                },
            ],
        })

        if (!isGoneOnTour) {
            resolve({
                status: 409,
                data: {
                    msg: 'User has not gone on this tour yet',
                }
            });
            return
        }

        const [feedback, created] = await db.FeedBack.findOrCreate({
            where: { customerId: customerId, tourId: tourId },
            defaults: { stars: stars, description: description }
        });

        resolve({
            status: created ? 201 : 400,
            data: {
                msg: created ? 'Create feedback successfully' : 'Feedback already exists',
                feedback: feedback
            }
        });
    } catch (error) {
        reject(error);
    }
});

const updateFeedback = (req) => new Promise(async (resolve, reject) => {
    const t = await db.sequelize.transaction();
    try {
        const feedbackId = req.params.feedbackId
        const feedback = await db.FeedBack.findOne({
            where: {
                feedbackId: feedbackId
            }
        })

        if (!feedback) {
            resolve({
                status: 404,
                data: {
                    msg: `Feedback not found with id ${feedbackId}`,
                }
            })
            return
        }

        var stars = req.query.stars
        if (isNaN(stars)) {
            resolve({
                status: 400,
                data: {
                    msg: "Stars need to be a numeric",
                }
            })
            return
        }
        if (stars === undefined || stars === null) {
            stars = feedback.stars
        }
        var description = req.query.description
        if (description === undefined || description === null) {
            description = feedback.description
        }
        var status = req.query.status
        if (status === undefined || status === null) {
            status = feedback.status
        }

        await db.FeedBack.update({
            stars: stars,
            description: description,
            status: status
        }, {
            where: {
                feedbackId: feedback.feedbackId
            },
            individualHooks: true,
            transaction: t
        })

        await t.commit()

        resolve({
            status: 200,
            data: {
                msg: "Update feedback successfully",
            }
        })

    } catch (error) {
        await t.rollback()
        reject(error);
    }
});

const deleteFeedback = (req) => new Promise(async (resolve, reject) => {
    try {
        const feedbackId = req.params.feedbackId

        const feedback = await db.FeedBack.findOne({
            where: {
                feedbackId: feedbackId
            }
        })

        if (!feedback) {
            resolve({
                status: 404,
                data: {
                    msg: `Feedback not found with id ${feedbackId}`,
                }
            })
            return
        }

        await db.FeedBack.update({
            status: STATUS.DEACTIVE
        }, {
            where: {
                feedbackId: feedback.feedbackId
            },
            individualHooks: true,
        })

        resolve({
            status: 200,
            data: {
                msg: "Delete feedback successfully",
            }
        })


    } catch (error) {
        reject(error);
    }
});


module.exports = { getFeedbacks, getFeedbacksByTourId, createFeedback, updateFeedback, deleteFeedback };