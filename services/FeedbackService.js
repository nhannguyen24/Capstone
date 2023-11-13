const db = require('../models');
const { Op, sequelize } = require('sequelize');
const STATUS = require("../enums/StatusEnum")
const TOUR_STATUS = require("../enums/TourStatusEnum")
const { StatusCodes } = require('http-status-codes');
const getFeedbacks = async (req) => {
    try {
        const page = parseInt(req.query.page)
        const limit = parseInt(req.query.limit)
        const offset = (page - 1) * limit
        const routeId = req.query.routeId || ""

        let whereClause = {}

        if (routeId !== "") {
            whereClause.routeId = routeId
        }


        const feedbacks = await db.Feedback.findAll({
            where: whereClause,
            include: [
                {
                    model: db.User,
                    as: "feedback_user",
                    attributes: ["userId", "userName", "avatar"]
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

        return{
            status: StatusCodes.OK,
            data: {
                msg: `Get list of feedbacks successfully`,
                paging: {
                    page: page,
                    limit: limit,
                    total: totalFeedback
                },
                feedbacks: feedbacks
            }
        }

    } catch (error) {
        console.log(error);
    }
}

const getFeedbackById = async (req) => {
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
                    attributes: ["userId", "userName", "avatar"]
                },
                {
                    model: db.Route,
                    as: "feedback_route",
                    attributes: ["routeId", "routeName"]
                },
            ],
        });

        return{
            status: feedback ? StatusCodes.OK : StatusCodes.NOT_FOUND,
            data: feedback ? {
                msg: `Get feedbacks successfully`,
                feedback: feedback
            } : {
                msg: `No feedbacks found!`,
            }
        }

    } catch (error) {
        console.log(error);
    }
}

const createFeedback = async (req) => {
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
            return{
                status: StatusCodes.NOT_FOUND,
                data: {
                    msg: `User not found!",`
                }
            }
        }

        //check route
        const route = await db.Route.findOne({
            where: {
                routeId: routeId
            }
        })

        if (!route) {
            return{
                status: StatusCodes.NOT_FOUND,
                data: {
                    msg: `Route not found!",`
                }
            }
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
            return{
                status: StatusCodes.FORBIDDEN,
                data: {
                    msg: 'Not gone on tour or tour not finished',
                }
            }
        }

        const [feedback, created] = await db.Feedback.findOrCreate({ 
                where: {
                    userId: customerId,
                    routeId: routeId
                } ,
                default: {stars: stars, description: description, userId: customerId, routeId: routeId}
            });

        await t.commit()
        return{
            status: created ? StatusCodes.CREATED : StatusCodes.BAD_REQUEST,
            data: {
                msg: created ? 'Create feedback successfully' : 'Customer already left feedback for this route',
                feedback: created ? feedback : "" 
            }
        }
    } catch (error) {
        await t.rollback()
        console.log(error);
    }
}

const updateFeedback = async (req) => {
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
            return{
                status: StatusCodes.NOT_FOUND,
                data: {
                    msg: `Feedback not found!`,
                }
            }
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
        return{
            status: StatusCodes.OK,
            data: {
                msg: "Update feedback successfully",
            }
        }

    } catch (error) {
        await t.rollback()
        console.log(error);
    }
}

const deleteFeedback = async (req) => {
    try {
        const feedbackId = req.params.id

        const feedback = await db.Feedback.findOne({
            where: {
                feedbackId: feedbackId
            }
        })

        if (!feedback) {
            return{
                status: StatusCodes.NOT_FOUND,
                data: {
                    msg: `Feedback not found!`,
                }
            }
        }

        await db.Feedback.destroy({
            where: {
                feedbackId: feedback.feedbackId
            },
            individualHooks: true,
        })

        return{
            status: StatusCodes.OK,
            data: {
                msg: "Delete feedback successfully",
            }
        }
    } catch (error) {
        console.log(error);
    }
}

module.exports = { getFeedbacks, getFeedbackById, createFeedback, updateFeedback, deleteFeedback };