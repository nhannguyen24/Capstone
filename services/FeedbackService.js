const db = require('../models');
const { Op, sequelize } = require('sequelize');
const STATUS = require("../enums/StatusEnum")
const TOUR_STATUS = require("../enums/TourStatusEnum")

const getFeedbacks = (req) => new Promise(async (resolve, reject) => {
    try {
        const page = parseInt(req.query.page)
        const limit = parseInt(req.query.limit)
        const offset = (page - 1) * limit
        const routeId = req.query.routeId || ""
        const status = req.query.status || ""

        let whereClause = {}

        if (routeId !== "") {
            whereClause.routeId = routeId
        }

        if (status.trim !== "") {
            whereClause.status = status
        }

        const feedbacks = await db.Feedback.findAll({
            where: whereClause,
            include: [
                {
                    model: db.User,
                    as: "feedback_user",
                    attributes: ["userId", "userName"]
                },
                {
                    model: db.Route,
                    as: "feedback_route",
                    attributes: ["routeId", "routeName"]
                },
            ],
            attributes: {
                exclude: ["userId", "routeId"]
            },
            order: [
                ["updatedAt", "DESC"]
            ],
            limit: limit,
            offset: offset
        });
        const totalFeedback = await db.Feedback.count({
            where: whereClause,
        });

        resolve({
            status: 200,
            data: {
                msg: `Get list of feedbacks successfully`,
                paging: {
                    page: page,
                    limit: limit,
                    total: totalFeedback
                },
                feedbacks: feedbacks
            }
        });

    } catch (error) {
        reject(error);
    }
});

const getFeedbackById = (req) => new Promise(async (resolve, reject) => {
    try {
        const feedbackId = req.params.id
        const feedback = await db.Feedback.findOne({
            where: {
                feedbackId: feedbackId
            },
            include: [
                {
                    model: db.User,
                    as: "feedback_user",
                    attributes: ["userId", "userName"]
                },
                {
                    model: db.Route,
                    as: "feedback_route",
                    attributes: ["routeId", "routeName"]
                },
            ],
        });

        resolve({
            status: feedback ? 200 : 404,
            data: feedback ? {
                msg: `Get feedbacks successfully`,
                feedback: feedback
            } : {
                msg: `No feedbacks found!`,
            }
        });

    } catch (error) {
        reject(error);
    }
});

const createFeedback = (req) => new Promise(async (resolve, reject) => {
    const t = await db.sequelize.transaction();
    try {
        const customerId = req.body.customerId
        const routeId = req.body.routeId
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
                    msg: `User not found!",`
                }
            })
            return
        }

        //check route
        const route = await db.Route.findOne({
            where: {
                routeId: routeId
            }
        })

        if (!route) {
            resolve({
                status: 404,
                data: {
                    msg: `Route not found!",`
                }
            })
            return
        }

        //Check if the user has gone on a tour
        const isGoneOnTour = await db.BookingDetail.findOne({
            raw: true,
            nest: true,
            include: [
                {
                    model: db.Booking,
                    as: "detail_booking",
                    where: {
                        isAttended: true
                    },
                    attributes: ["bookingId"],
                    include: {
                        model: db.User,
                        as: "booking_user",
                        where: {
                            userId: customerId
                        },
                        attributes: ["userId", "userName"]
                    }
                },
                {
                    model: db.Ticket,
                    as: "booking_detail_ticket",
                    attributes: {
                        exclude: ["ticketId"]
                    },
                    include: [
                        {
                            model: db.Tour,
                            as: "ticket_tour",
                            where: {
                                tourStatus: TOUR_STATUS.FINISHED,
                                routeId: routeId
                            },
                        }
                    ]
                },
            ],
            attributes: {
                exclude: ["bookingId", "ticketId", "createdAt", "updatedAt"]
            }

        })

        if (!isGoneOnTour) {
            resolve({
                status: 403,
                data: {
                    msg: 'Not gone on tour or tour not finished',
                }
            });
            return
        }

        const [feedback, created] = await db.Feedback.findOrCreate({ 
                where: {
                    userId: customerId,
                    routeId: routeId
                } ,
                default: {stars: stars, description: description, userId: customerId, routeId: routeId}
            });

        await t.commit()
        resolve({
            status: created ? 201 : 400,
            data: {
                msg: created ? 'Create feedback successfully' : 'Customer already left feedback for this route',
                feedback: created ? feedback : "" 
            }
        });
    } catch (error) {
        await t.rollback()
        reject(error);
    }
});

const updateFeedback = (req) => new Promise(async (resolve, reject) => {
    const t = await db.sequelize.transaction();
    try {
        const feedbackId = req.params.id
        const stars = parseInt(req.body.stars) || ""
        const description = req.body.description || ""

        const updateFeedback = {}

        const feedback = await db.Feedback.findOne({
            where: {
                feedbackId: feedbackId
            }
        })

        if (!feedback) {
            resolve({
                status: 404,
                data: {
                    msg: `Feedback not found!`,
                }
            })
            return
        }

        if (stars !== "") {
            updateFeedback.stars = stars
        }
        
        if (description !== "") {
            updateFeedback.description = description
        }

        await db.Feedback.update(updateFeedback, {
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
        const feedbackId = req.params.id

        const feedback = await db.Feedback.findOne({
            where: {
                feedbackId: feedbackId
            }
        })

        if (!feedback) {
            resolve({
                status: 404,
                data: {
                    msg: `Feedback not found!`,
                }
            })
            return
        }

        await db.Feedback.destroy({
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


module.exports = { getFeedbacks, getFeedbackById, createFeedback, updateFeedback, deleteFeedback };