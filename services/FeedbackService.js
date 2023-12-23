const db = require('../models')
const { Op, sequelize } = require('sequelize')
const TOUR_SCHEDULE_STATUS = require("../enums/TourScheduleStatusEnum")
const { StatusCodes } = require('http-status-codes')
const getFeedbacks = async (req) => {
    try {
        const page = parseInt(req.query.page)
        const limit = parseInt(req.query.limit)
        const offset = (page - 1) * limit
        const tourId = req.query.tourId || ""
        const userId = req.query.userId || ""

        let whereClause = {}

        if (tourId.trim() !== "") {
            whereClause.tourId = tourId
        }
        if (userId.trim() !== "") {
            whereClause.userId = userId
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
                    model: db.Tour,
                    as: "feedback_tour",
                    attributes: ["tourId", "tourName"]
                },
            ],
            attributes: {
                exclude: ["userId", "tourId"]
            },
            order: [
                ["updatedAt", "DESC"]
            ],
            limit: limit,
            offset: offset
        })
        const totalFeedback = await db.Feedback.count({
            where: whereClause,
        })

        return {
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
        console.error(error)
        return {
            status: StatusCodes.INTERNAL_SERVER_ERROR,
            data: {
                msg: "An error has occurred!",
            }
        }
    }
}

const getFeedbackById = async (feedbackId) => {
    try {
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
                    model: db.Tour,
                    as: "feedback_tour",
                    attributes: ["tourId", "tourName"]
                },
            ],
        })

        return {
            status: feedback ? StatusCodes.OK : StatusCodes.NOT_FOUND,
            data: feedback ? {
                msg: `Get feedback successfully`,
                feedback: feedback
            } : {
                msg: `Feedback not found!`,
                feedback: {}
            }
        }

    } catch (error) {
        console.error(error)
        return {
            status: StatusCodes.INTERNAL_SERVER_ERROR,
            data: {
                msg: "An error has occurred!",
            }
        }
    }
}

const createFeedback = async (req) => {
    const t = await db.sequelize.transaction()
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
            return {
                status: StatusCodes.NOT_FOUND,
                data: {
                    msg: `User not found!`
                }
            }
        }

        //check tour existed
        const tour = await db.Tour.findOne({
            where: {
                tourId: tourId
            }
        })

        if (!tour) {
            return {
                status: StatusCodes.NOT_FOUND,
                data: {
                    msg: `Tour not found!`
                }
            }
        }

        //Check if the user has gone on a tour
        const isGoneOnTour = await db.Booking.findOne({
            raw: true,
            nest: true,
            include: [
                {
                    model: db.Schedule,
                    as: "booking_schedule",
                    where: {
                        tourId: tourId,
                        scheduleStatus: TOUR_SCHEDULE_STATUS.FINISHED
                    }
                }, {
                    model: db.User,
                    as: "booking_user",
                    where: {
                        userId: customerId
                    },
                    attributes: ["userId", "userName"]
                }
            ],
            where: {
                isAttended: true
            },
        })

        if (!isGoneOnTour) {
            return {
                status: StatusCodes.BAD_REQUEST,
                data: {
                    msg: 'User not gone on this tour or tour not finished!',
                }
            }
        }

        const [feedback, created] = await db.Feedback.findOrCreate({
            where: {
                userId: customerId,
                tourId: tourId
            },
            defaults: { stars: stars, description: description, userId: customerId, tourId: tourId }
        })

        await t.commit()
        return {
            status: created ? StatusCodes.CREATED : StatusCodes.BAD_REQUEST,
            data: {
                msg: created ? 'Create feedback successfully' : 'Customer already left feedback for this route',
                feedback: created ? feedback : ""
            }
        }
    } catch (error) {
        await t.rollback()
        console.error(error)
        return {
            status: StatusCodes.INTERNAL_SERVER_ERROR,
            data: {
                msg: "An error has occurred!",
            }
        }
    }
}

const updateFeedback = async (req) => {
    const t = await db.sequelize.transaction()
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
            return {
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
        return {
            status: StatusCodes.OK,
            data: {
                msg: "Update feedback successfully",
            }
        }

    } catch (error) {
        await t.rollback()
        console.error(error)
        return {
            status: StatusCodes.INTERNAL_SERVER_ERROR,
            data: {
                msg: "An error has occurred!",
            }
        }
    }
}

const deleteFeedback = async (feedbackId) => {
    try {
        const feedback = await db.Feedback.findOne({
            where: {
                feedbackId: feedbackId
            }
        })

        if (!feedback) {
            return {
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

        return {
            status: StatusCodes.OK,
            data: {
                msg: "Delete feedback successfully",
            }
        }
    } catch (error) {
        console.error(error)
        return {
            status: StatusCodes.INTERNAL_SERVER_ERROR,
            data: {
                msg: "An error has occurred!",
            }
        }
    }
}

module.exports = { getFeedbacks, getFeedbackById, createFeedback, updateFeedback, deleteFeedback }