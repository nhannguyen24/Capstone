const db = require('../models');
const { Op } = require('sequelize');

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
                exclude: ["busCateId"]
            },
            include: [
                {
                    model: db.BusCategory,
                    as: "bus_cate",
                },
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
            data: buses ? {
                msg: `Get the list of the buses successfully`,
                buses: buses
            } : {
                msg: `Bus not found`,
                buses: []
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
        const busCateId = req.query.busCateId
        const image = req.query.image

        const busCate = await db.BusCategory.findOne({
            where: {
                busCateId: busCateId
            }
        })

        if (!busCate) {
            resolve({
                status: 400,
                data: {
                    msg: `Bus category not found with id ${busCateId}`,
                }
            })
        }

        const [bus, created] = await db.Bus.findOrCreate({
            where: { busPlate: busPlate },
            defaults: { busPlate: busPlate, numberSeat: seat, busCateId: busCate.busCateId }
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
                status: 400,
                data: {
                    msg: `Bus not found with id ${busId}`,
                }
            })
        }

        var busCateId = req.query.busCateId
        if (busCateId === undefined || busCateId === null) {
            busCateId = bus.busCateId
        } else {
            const busCate = await db.BusCategory.findOne({
                where: {
                    busCateId: busCateId
                }
            })
            if (!busCate) {
                resolve({
                    status: 400,
                    data: {
                        msg: `Bus category not found with id ${busCateId}`,
                    }
                })
            }
        }

        var busPlate = req.query.busPlate
        if (busPlate === undefined || busPlate === null) {
            busPlate = bus.busPlate
        }
        var seat = req.query.numberSeat
        if (seat === undefined || seat === null) {
            seat = bus.numberSeat
        }
        var status = req.query.status
        if (status === undefined || status === null) {
            status = bus.status
        }

        if ("Deactive" == status) {
            const tour = await db.TourDetail.findOne({
                where: {
                    busId: busId,
                    status: {
                        [Op.like]: "Active"
                    }
                },
                order: [
                    ["date", "DESC"]
                ]
            })

            if (tour) {
                const tourDate = new Date(tour.date)
                const currentDate = new Date()
                if (tourDate > currentDate) {
                    resolve({
                        status: 409,
                        data: {
                            msg: `Cannot update bus status to Deactive because it currently has ongoing job`,
                            tour: tour
                        }
                    })
                }
            }
        }


        await db.Bus.update({
            busPlate: busPlate,
            numberSeat: seat,
            busCateId: busCateId,
            status: status
        }, {
            where: {
                busId: bus.busId
            }, transaction: t
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
                status: 400,
                data: {
                    msg: `Bus not found with id ${busId}`,
                }
            })
        }

        const tour = await db.TourDetail.findOne({
            where: {
                busId: busId,
                status: {
                    [Op.like]: "Active"
                }
            },
            order: [
                ["date", "DESC"]
            ]
        })

        if (tour) {
            const tourDate = new Date(tour.date)
            const currentDate = new Date()
            if (tourDate > currentDate) {
                resolve({
                    status: 409,
                    data: {
                        msg: `Cannot delete bus because it currently has ongoing job`,
                    }
                })
            }
        }

        await db.Bus.update({
            status: "Deactive"
        }, {
            where: {
                busId: bus.busId
            }
        })

        resolve({
            status: 200,
            data: {
                msg: "Update bus status successfully",
            }
        })


    } catch (error) {
        reject(error);
    }
});


module.exports = { getAllBuses, createBus, updateBus, deleteBus };