const db = require('../models');
const { Op } = require('sequelize');
const STATUS = require("../enums/StatusEnum")

const getAllBuses = (req) => new Promise(async (resolve, reject) => {
    try {
        var busPlate = req.query.busPlate
        if (busPlate === undefined || busPlate === null) {
            busPlate = ""
        }

        const buses = await db.Bus.findAll({
            where: {
                busPlate: {
                    [Op.substring]: busPlate
                }
            },
            attributes: {
                exclude: []
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
        });

        resolve({
            status: 200,
            data: {
                msg: `Get list of the buses successfully`,
                buses: buses
            }
        });

    } catch (error) {
        reject(error);
    }
});

const getBusById = (req) => new Promise(async (resolve, reject) => {
    try {
        const busId = req.params.busId

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
        });


        resolve({
            status: bus ? 200 : 404,
            data: bus ? {
                msg: `Get bus successfully`,
                bus: bus
            } : {
                msg: `Bus not found`,
                bus: {}
            }
        });

    } catch (error) {
        reject(error);
    }
});

const createBus = (req) => new Promise(async (resolve, reject) => {
    try {
        const busPlate = req.query.busPlate
        const seat = req.query.numberSeat
        const isDoubleDecker = req.query.isDoubleDecker
        const image = req.query.image

        const [bus, created] = await db.Bus.findOrCreate({
            where: { busPlate: busPlate },
            defaults: { busPlate: busPlate, numberSeat: seat, isDoubleDecker: isDoubleDecker }
        });

        await db.Image.create({
            image: image,
            busId: bus.dataValues.busId,
        });

        resolve({
            status: created ? 201 : 400,
            data: {
                msg: created ? 'Create bus successfully' : 'Bus already exists',
                bus: bus
            }
        });
    } catch (error) {
        reject(error);
    }
});

const updateBus = (req) => new Promise(async (resolve, reject) => {
    const t = await db.sequelize.transaction();
    try {
        const busId = req.params.busId
        const bus = await db.Bus.findOne({
            where: {
                busId: busId
            }
        })

        if (!bus) {
            resolve({
                status: 404,
                data: {
                    msg: `Bus not found with id ${busId}`,
                }
            })
            return
        }

        var busPlate = req.query.busPlate
        if (busPlate === undefined || busPlate === null) {
            busPlate = bus.busPlate
        }
        var seat = req.query.numberSeat
        if (seat === undefined || seat === null) {
            seat = bus.numberSeat
        }
        var isDoubleDecker = req.query.isDoubleDecker
        if (isDoubleDecker === undefined || isDoubleDecker === null) {
            isDoubleDecker = bus.isDoubleDecker
        }
        var status = req.query.status
        if (status === undefined || status === null) {
            status = bus.status
        }

        if (STATUS.DEACTIVE == status) {
            const schedule = await db.Schedule.findOne({
                where: {
                    busId: busId,
                    status: {
                        [Op.like]: STATUS.ACTIVE
                    }
                },
                order: [
                    ["date", "DESC"]
                ]
            })

            if (schedule) {
                const scheduleDate = new Date(schedule.date)
                const currentDate = new Date()
                if (scheduleDate > currentDate) {
                    resolve({
                        status: 409,
                        data: {
                            msg: `Cannot update bus status to Deactive because it currently has ongoing tour`,
                            tour: tour
                        }
                    })
                    return
                }
            }
        }


        await db.Bus.update({
            busPlate: busPlate,
            numberSeat: seat,
            isDoubleDecker: isDoubleDecker,
            status: status
        }, {
            where: {
                busId: bus.busId
            },
            individualHooks: true,
            transaction: t
        })

        await t.commit()

        resolve({
            status: 200,
            data: {
                msg: "Update bus successfully",
            }
        })

    } catch (error) {
        await t.rollback()
        reject(error);
    }
});

const deleteBus = (req) => new Promise(async (resolve, reject) => {
    try {
        const busId = req.params.busId

        const bus = await db.Bus.findOne({
            where: {
                busId: busId
            }
        })

        if (!bus) {
            resolve({
                status: 404,
                data: {
                    msg: `Bus not found with id ${busId}`,
                }
            })
            return
        }

        const schedule = await db.Schedule.findOne({
            where: {
                busId: busId,
                status: {
                    [Op.like]: STATUS.ACTIVE
                }
            },
            order: [
                ["date", "DESC"]
            ]
        })

        if (schedule) {
            const scheduleDate = new Date(schedule.date)
            const currentDate = new Date()
            if (scheduleDate > currentDate) {
                resolve({
                    status: 409,
                    data: {
                        msg: `Cannot update bus status to Deactive because it currently has ongoing tour`,
                        tour: tour
                    }
                })
                return
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

        resolve({
            status: 200,
            data: {
                msg: "Delete bus successfully",
            }
        })


    } catch (error) {
        reject(error);
    }
});


module.exports = { getAllBuses, getBusById, createBus, updateBus, deleteBus };