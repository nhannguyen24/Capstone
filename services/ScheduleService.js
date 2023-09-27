const db = require("../models");
const { Op } = require("sequelize");
const redisClient = require("../config/RedisConfig");
const STATUS = require("../enums/StatusEnum")

const getAllSchedule = (
    { page, limit, order, busId, tourId, tourGuideId, driverId, status, ...query },
    roleName
) =>
    new Promise(async (resolve, reject) => {
        try {
            redisClient.get(`schedules_${page}_${limit}_${order}_${busId}_${tourId}_${tourGuideId}_${driverId}_${status}`, async (error, schedule) => {
                if (error) console.error(error);
                if (schedule != null && schedule != "" && roleName != 'Admin') {
                    resolve({
                        status: 200,
                        data: {
                            msg: "Got schedules",
                            schedules: JSON.parse(schedule),
                        }
                    });
                } else {
                    redisClient.get(`admin_schedules_${page}_${limit}_${order}_${busId}_${tourId}_${tourGuideId}_${driverId}_${status}`, async (error, adminSchedule) => {
                        if (adminSchedule != null && adminSchedule != "") {
                            resolve({
                                status: 200,
                                data: {
                                    msg: "Got schedules",
                                    schedules: JSON.parse(adminSchedule),
                                }
                            });
                        } else {
                            const queries = { nest: true };
                            const offset = !page || +page <= 1 ? 0 : +page - 1;
                            const flimit = +limit || +process.env.LIMIT_POST;
                            queries.offset = offset * flimit;
                            queries.limit = flimit;
                            if (order) queries.order = [[order]]
                            else {
                                queries.order = [['updatedAt', 'DESC']];
                            }
                            if (busId) query.busId = { [Op.eq]: busId };
                            if (tourId) query.tourId = { [Op.eq]: tourId };
                            if (tourGuideId) query.tourGuideId = { [Op.eq]: tourGuideId };
                            if (driverId) query.driverId = { [Op.eq]: driverId };
                            if (status) query.status = { [Op.eq]: status };
                            if (roleName !== "Admin") {
                                query.status = { [Op.notIn]: ['Deactive'] };
                            }
                            const schedules = await db.Schedule.findAll({
                                where: query,
                                ...queries,
                                attributes: {
                                    exclude: [
                                        "busId",
                                        "tourId",
                                        "tourGuideId",
                                        "driverId",
                                    ],
                                },
                                include: [
                                    {
                                        model: db.Tour,
                                        as: "schedule_tour",
                                        attributes: {
                                            exclude: [
                                                "createdAt",
                                                "updatedAt",
                                                "status",
                                            ],
                                        },
                                        include: [
                                            {
                                                model: db.Image,
                                                as: "tour_image",
                                                attributes: {
                                                    exclude: [
                                                        "tourId",
                                                        "busId",
                                                        "tourId",
                                                        "poiId",
                                                        "productId",
                                                        "feedbackId",
                                                        "createdAt",
                                                        "updatedAt",
                                                        "status",
                                                    ],
                                                },
                                            },
                                        ]
                                    },
                                    {
                                        model: db.Bus,
                                        as: "schedule_bus",
                                        attributes: {
                                            exclude: [
                                                "createdAt",
                                                "updatedAt",
                                                "status",
                                            ],
                                        },
                                    },
                                    {
                                        model: db.User,
                                        as: "schedule_tourguide",
                                        attributes: {
                                            exclude: [
                                                "password",
                                                "birthday",
                                                "address",
                                                "refreshToken",
                                                "accessChangePassword",
                                                "createdAt",
                                                "updatedAt",
                                                "status",
                                            ],
                                        },
                                    },
                                    {
                                        model: db.User,
                                        as: "schedule_driver",
                                        attributes: {
                                            exclude: [
                                                "password",
                                                "birthday",
                                                "address",
                                                "refreshToken",
                                                "accessChangePassword",
                                                "createdAt",
                                                "updatedAt",
                                                "status",
                                            ],
                                        },
                                    },
                                ]
                            });

                            if (roleName !== "Admin") {
                                redisClient.setEx(`schedules_${page}_${limit}_${order}_${busId}_${tourId}_${tourGuideId}_${driverId}_${status}`, 3600, JSON.stringify(schedules));
                            } else {
                                redisClient.setEx(`admin_schedules_${page}_${limit}_${order}_${busId}_${tourId}_${tourGuideId}_${driverId}_${status}`, 3600, JSON.stringify(schedules));
                            }
                            resolve({
                                status: schedules ? 200 : 404,
                                data: {
                                    msg: schedules ? "Got schedules" : "Cannot find schedules",
                                    schedules: schedules,
                                }
                            });
                        }
                    })
                }
            })
        } catch (error) {
            console.log(error);
            reject(error);
        }
    });

const getScheduleById = (scheduleId) =>
    new Promise(async (resolve, reject) => {
        try {
            const schedule = await db.Schedule.findAll({
                where: { scheduleId: scheduleId },
                nest: true,
                attributes: {
                    exclude: ["busId", "tourId", "tourGuideId", "driverId", "createdAt", "updatedAt"],
                },
                include: [
                    {
                        model: db.Tour,
                        as: "schedule_tour",
                        attributes: {
                            exclude: [
                                "createdAt",
                                "updatedAt",
                                "status",
                            ],
                        },
                    },
                    {
                        model: db.Bus,
                        as: "schedule_bus",
                        attributes: {
                            exclude: [
                                "createdAt",
                                "updatedAt",
                                "status",
                            ],
                        },
                    },
                    {
                        model: db.User,
                        as: "schedule_tourguide",
                        attributes: {
                            exclude: [
                                "createdAt",
                                "updatedAt",
                                "status",
                            ],
                        },
                    },
                    {
                        model: db.User,
                        as: "schedule_driver",
                        attributes: {
                            exclude: [
                                "createdAt",
                                "updatedAt",
                                "status",
                            ],
                        },
                    },
                ]
            });
            resolve({
                status: schedule ? 200 : 404,
                data: {
                    msg: schedule ? "Got schedule" : `Cannot find schedule with id: ${scheduleId}`,
                    schedule: schedule,
                }
            });
        } catch (error) {
            reject(error);
        }
    });

const createSchedule = (body) =>
    new Promise(async (resolve, reject) => {
        try {
            const findBusActive = await db.Bus.findAll({
                raw: true,
                nest: true,
                where: {
                    status: STATUS.ACTIVE
                },
                attributes: ["busId", "status"],
            });
            // console.log(findBusActive[0]);

            const findTourTime = await db.Tour.findOne({
                raw: true,
                nest: true,
                where: {
                    tourId: body.tourId
                },
                attributes: ["tourId", "departureDate", "duration"],
            });
            // console.log(findTourTime);
            const currentDate = new Date();
            currentDate.setHours(currentDate.getHours() + 7);
            const departureDateBefore = new Date(findTourTime.departureDate);
            const departureDate = new Date(findTourTime.departureDate);

            // Split the duration string into hours, minutes, and seconds
            const [hours, minutes, seconds] = findTourTime.duration.split(':').map(Number);

            // Add the duration to the departureDate
            departureDate.setHours(departureDate.getHours() + hours);
            departureDate.setMinutes(departureDate.getMinutes() + minutes);
            departureDate.setSeconds(departureDate.getSeconds() + seconds);
            // Now, departureDate holds the endTime
            const endDate = departureDate.toISOString();

            if (currentDate >= departureDateBefore || currentDate.getTime() >= departureDateBefore.getTime()) {
                resolve({
                    status: 400,
                    data: {
                        msg: "Start date can't be earlier than current date"
                    }
                })
                return;
            } else {
                const findTourGuideTime = await db.Schedule.findOne({
                    raw: true,
                    nest: true,
                    where: {
                        startTime: findTourTime.departureDate,
                        endTime: endDate,
                        tourGuideId: body.tourGuideId,
                    },
                });

                const findDriverTime = await db.Schedule.findOne({
                    raw: true,
                    nest: true,
                    where: {
                        startTime: findTourTime.departureDate,
                        endTime: endDate,
                        driverId: body.driverId,
                    },
                });

                if (findTourGuideTime) {
                    resolve({
                        status: 400,
                        data: {
                            msg: "Duplicate schedules time for tour guide"
                        }
                    })
                    return;
                } else if (findDriverTime) {
                    resolve({
                        status: 400,
                        data: {
                            msg: "Duplicate schedules time for driver"
                        }
                    })
                    return;
                } else {
                    const createSchedule = await db.Schedule.create({
                        startTime: findTourTime.departureDate,
                        endTime: endDate,
                        busId: body.busId ? body.busId : findBusActive[0].busId,
                        ...body,
                    });

                    resolve({
                        status: createSchedule ? 200 : 400,
                        data: {
                            msg: createSchedule
                                ? "Create new schedule successfully"
                                : "Cannot create new schedule",
                            schedule: createSchedule ? createSchedule.dataValues : null,
                        }
                    });
                    redisClient.keys('*schedules_*', (error, keys) => {
                        if (error) {
                            console.error('Error retrieving keys:', error);
                            return;
                        }
                        // Delete each key individually
                        keys.forEach((key) => {
                            redisClient.del(key, (deleteError, reply) => {
                                if (deleteError) {
                                    console.error(`Error deleting key ${key}:`, deleteError);
                                } else {
                                    console.log(`Key ${key} deleted successfully`);
                                }
                            });
                        });
                    });
                }
            }

        } catch (error) {
            reject(error);
        }
    });

const updateSchedule = ({ scheduleId, ...body }) =>
    new Promise(async (resolve, reject) => {
        try {
            const currentDate = new Date();
            currentDate.setHours(currentDate.getHours() + 7);
            const startTime = new Date(body.startTime);
            const endTime = new Date(body.endTime);

            if (currentDate >= startTime || currentDate.getTime() >= startTime.getTime()) {
                resolve({
                    status: 400,
                    data: {
                        msg: "Start time can't be earlier than current date"
                    }
                })
                return;
            } else if (startTime >= endTime || startTime.getTime() >= endTime.getTime()) {
                resolve({
                    status: 400,
                    data: {
                        msg: "Start time can't be later than End time",
                    }
                });
                return;
            } else {
                const schedules = await db.Schedule.update(body, {
                    where: { scheduleId },
                    individualHooks: true,
                });

                resolve({
                    status: schedules[0] > 0 ? 200 : 400,
                    data: {
                        msg:
                            schedules[0] > 0
                                ? `${schedules[0]} schedule update`
                                : "Cannot update schedule/ scheduleId not found",
                    }
                });

                redisClient.keys('*schedules_*', (error, keys) => {
                    if (error) {
                        console.error('Error retrieving keys:', error);
                        return;
                    }
                    // Delete each key individually
                    keys.forEach((key) => {
                        redisClient.del(key, (deleteError, reply) => {
                            if (deleteError) {
                                console.error(`Error deleting key ${key}:`, deleteError);
                            } else {
                                console.log(`Key ${key} deleted successfully`);
                            }
                        });
                    });
                });
            }

        } catch (error) {
            reject(error.message);
        }
    });


const deleteSchedule = (scheduleIds) =>
    new Promise(async (resolve, reject) => {
        try {
            const findPonit = await db.Schedule.findAll({
                raw: true, nest: true,
                where: { scheduleId: scheduleIds },
            });

            for (const schedulent of findPonit) {
                if (schedulent.status === "Deactive") {
                    resolve({
                        status: 400,
                        data: {
                            msg: "The schedule already deactive!",
                        }
                    });
                }
            }

            const schedules = await db.Schedule.update(
                { status: "Deactive" },
                {
                    where: { scheduleId: scheduleIds },
                    individualHooks: true,
                }
            );
            resolve({
                status: schedules[0] > 0 ? 200 : 400,
                data: {
                    msg:
                        schedules[0] > 0
                            ? `${schedules[0]} schedule delete`
                            : "Cannot delete schedule/ scheduleId not found",
                }
            });

            redisClient.keys('*schedules_*', (error, keys) => {
                if (error) {
                    console.error('Error retrieving keys:', error);
                    return;
                }
                // Delete each key individually
                keys.forEach((key) => {
                    redisClient.del(key, (deleteError, reply) => {
                        if (deleteError) {
                            console.error(`Error deleting key ${key}:`, deleteError);
                        } else {
                            console.log(`Key ${key} deleted successfully`);
                        }
                    });
                });
            });

        } catch (error) {
            reject(error);
        }
    });

module.exports = {
    updateSchedule,
    deleteSchedule,
    createSchedule,
    getAllSchedule,
    getScheduleById,
};

