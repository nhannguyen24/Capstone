const db = require('../models');
const { Op } = require('sequelize');
const STATUS = require("../enums/StatusEnum")

const getAllBuses = (req) => new Promise(async (resolve, reject) => {
    try {
        const page = parseInt(req.query.page)
        const limit = parseInt(req.query.limit)
        const offset = parseInt((page - 1) * limit)   
        const busPlate = req.query.busPlate || ""
        let isDoubleDecker = req.query.isDoubleDecker || ""
        const status = req.query.status || ""

        let whereClause = {}

        if(busPlate.trim() !== ""){
            whereClause.busPlate = {
                [Op.substring]: busPlate
            }
        }

        if(isDoubleDecker !== ""){
            if(isDoubleDecker === "true") {
                isDoubleDecker = 1
            } else if(isDoubleDecker === "false"){
                isDoubleDecker = 0
            }
            whereClause.isDoubleDecker = isDoubleDecker
        }
        
        if(status !== ""){
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
        });

        resolve({
            status: 200,
            data: {
                msg: `Get buses successfully`,
                paging: {
                    page: page,
                    limit: limit,
                },
                buses: buses
            }
        });

    } catch (error) {
        reject(error);
    }
});

const getBusById = (req) => new Promise(async (resolve, reject) => {
    try {
        const busId = req.params.id

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
        const busId = req.params.id
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
            const tour = await db.Tour.findOne({
                where: {
                    busId: busId,
                    status: STATUS.ACTIVE,
                    tourStatus: {
                        [Op.in]: ['NotStarted', 'OnTour'],
                    },
                },
            })
    
            if (tour) {
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
        const busId = req.params.id

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

        const tour = await db.Tour.findOne({
            where: {
                busId: busId,
                status: STATUS.ACTIVE,
                tourStatus: {
                    [Op.in]: ['NotStarted', 'OnTour'],
                },
            },
        })

        if (tour) {
            resolve({
                status: 409,
                data: {
                    msg: `Cannot update bus status to Deactive because it currently has ongoing tour`,
                    tour: tour
                }
            })
            return
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