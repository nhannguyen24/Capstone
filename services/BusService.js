const db = require('../models')
const { Op } = require('sequelize')
const STATUS = require("../enums/StatusEnum")
const { StatusCodes } = require('http-status-codes')

const getBuses = async (req) => {
    try {
        const page = parseInt(req.query.page)
        const limit = parseInt(req.query.limit)
        const offset = (page - 1) * limit
        const busPlate = req.query.busPlate || ""
        let isDoubleDecker = req.query.isDoubleDecker || ""
        const status = req.query.status || ""

        let whereClause = {}

        if (busPlate.trim() !== "") {
            whereClause.busPlate = {
                [Op.substring]: busPlate
            }
        }

        if (isDoubleDecker !== "") {
            if (isDoubleDecker === "true") {
                isDoubleDecker = 1
            } else if (isDoubleDecker === "false") {
                isDoubleDecker = 0
            }
            whereClause.isDoubleDecker = isDoubleDecker
        }

        if (status !== "") {
            whereClause.status = status
        }

        const buses = await db.Bus.findAll({
            offset: offset,
            limit: limit,
            where: whereClause,
            include: [
                {
                    model: db.Image,
                    as: "bus_image",
                    attributes: {
                        exclude: [
                            "poiId",
                            "busId",
                            "tourId",
                            "productId",
                            "createdAt",
                            "updatedAt",
                            "status",
                        ],
                    },
                },
            ],
        })
        const totalBus = await db.Bus.count({
            where: whereClause,
        })

        return {
            status: buses.length > 0 ? StatusCodes.OK : StatusCodes.NOT_FOUND,
            data: {
                msg: buses.length > 0 ?  `Get buses successfully` : `Buses not found!`,
                paging: {
                    page: page,
                    limit: limit,
                    total: totalBus
                },
                buses: buses
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

const getBusById = async (busId) => {
    try {
        const bus = await db.Bus.findOne({
            where: {
                busId: busId
            },
            include: [
                {
                    model: db.Image,
                    as: "bus_image",
                    attributes: {
                        exclude: [
                            "poiId",
                            "busId",
                            "tourId",
                            "productId",
                            "feedbackId",
                            "createdAt",
                            "updatedAt",
                            "status",
                        ],
                    },
                },
            ],
        })

        return {
            status: bus ? StatusCodes.OK : StatusCodes.NOT_FOUND,
            data: {
                msg: bus ? `Get bus successfully` : `Bus not found`,
                bus: bus
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

const createBus = async (req) => {
    try {
        const busPlate = req.query.busPlate
        const seat = req.query.numberSeat
        const isDoubleDecker = req.query.isDoubleDecker
        const image = req.query.image

        const [bus, created] = await db.Bus.findOrCreate({
            where: { busPlate: busPlate },
            defaults: { busPlate: busPlate, numberSeat: seat, isDoubleDecker: isDoubleDecker }
        })

        await db.Image.create({
            image: image,
            busId: bus.dataValues.busId,
        })

        return {
            status: created ? StatusCodes.CREATED : StatusCodes.BAD_REQUEST,
            data: {
                msg: created ? 'Create bus successfully' : 'Bus plate existed',
                bus: bus
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

const updateBus = async (req) => {
    const t = await db.sequelize.transaction()
    try {
        const busId = req.params.id
        const busPlate = req.body.busPlate || ""
        const seat = parseInt(req.body.numberSeat) || ""
        const isDoubleDecker = req.body.isDoubleDecker || ""
        const status = req.body.status || ""

        const updateBus = {}

        const bus = await db.Bus.findOne({
            where: {
                busId: busId
            }
        })

        if (!bus) {
            return {
                status: StatusCodes.NOT_FOUND,
                data: {
                    msg: `Bus not found!`,
                }
            }
        }

        if (busPlate !== "") {
            const bus = await db.Bus.findOne({
                where: {
                    busPlate: busPlate
                }
            })
            if (bus) {
                if (bus.busId !== busId) {
                    return {
                        status: StatusCodes.BAD_REQUEST,
                        data: {
                            msg: `Bus plate already existed!`,
                        }
                    }
                }
            }
            updateBus.busPlate = busPlate
        }

        if (seat !== "") {
            updateBus.numberSeat = seat
        }

        if (isDoubleDecker !== "") {
            updateBus.isDoubleDecker = isDoubleDecker
        }

        if (status !== "") {
            if (bus.status === status) {
                return {
                    status: StatusCodes.BAD_REQUEST,
                    data: {
                        msg: `Bus status is already ${bus.status}`,
                    }
                }
            }
            if (STATUS.DEACTIVE == status) {
                const tour = await db.Tour.findOne({
                    where: {
                        busId: busId,
                        status: STATUS.ACTIVE,
                        tourStatus: {
                            [Op.in]: ['Started', 'Available'],
                        },
                    },
                })

                if (tour) {
                    return {
                        status: StatusCodes.BAD_REQUEST,
                        data: {
                            msg: `Cannot update bus status because bus currently has an on going tour`,
                            tour: tour
                        }
                    }
                }
            }
            updateBus.status = status
        }

        await db.Bus.update(updateBus, {
            where: {
                busId: bus.busId
            },
            individualHooks: true,
            transaction: t
        })

        await t.commit()

        return {
            status: StatusCodes.OK,
            data: {
                msg: "Update bus successfully",
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

const deleteBus = async (busId) => {
    try {
        const bus = await db.Bus.findOne({
            where: {
                busId: busId
            }
        })

        if (!bus) {
            return {
                status: StatusCodes.NOT_FOUND,
                data: {
                    msg: `Bus not found!`,
                }
            }
        }

        const tour = await db.Tour.findOne({
            where: {
                busId: busId,
                status: STATUS.ACTIVE,
                tourStatus: {
                    [Op.in]: ['Started', 'Available'],
                },
            },
        })

        if (tour) {
            return {
                status: StatusCodes.BAD_REQUEST,
                data: {
                    msg: `Cannot update bus status to Deactive because bus is currently has an ongoing tour`,
                    tour: tour
                }
            }
        }

        await db.Bus.update({
            status: STATUS.DEACTIVE
        }, {
            where: {
                busId: bus.busId
            },
            individualHooks: true,
        })

        return {
            status: StatusCodes.OK,
            data: {
                msg: "Delete bus successfully",
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

module.exports = { getBuses, getBusById, createBus, updateBus, deleteBus }