const db = require("../models");
const { Op } = require("sequelize");
const redisClient = require("../config/RedisConfig");

const getAllSchedule = (
    { page, limit, order, busId, tourId, tourGuildId, driverId, status, ...query },
    roleName
) =>
    new Promise(async (resolve, reject) => {
        try {
            redisClient.get(`schedules_${page}_${limit}_${order}_${busId}_${tourId}_${tourGuildId}_${driverId}_${status}`, async (error, schedule) => {
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
                    redisClient.get(`admin_schedules_${page}_${limit}_${order}_${busId}_${tourId}_${tourGuildId}_${driverId}_${status}`, async (error, adminSchedule) => {
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
                            if (tourGuildId) query.tourGuildId = { [Op.eq]: tourGuildId };
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
                                        "tourguildId",
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
                                        as: "schedule_tourguild",
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
                                redisClient.setEx(`schedules_${page}_${limit}_${order}_${busId}_${tourId}_${tourGuildId}_${driverId}_${status}`, 3600, JSON.stringify(schedules));
                            } else {
                                redisClient.setEx(`admin_schedules_${page}_${limit}_${order}_${busId}_${tourId}_${tourGuildId}_${driverId}_${status}`, 3600, JSON.stringify(schedules));
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
                    exclude: ["busId", "tourId", "tourguildId", "driverId", "createdAt", "updatedAt"],
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
                        as: "schedule_tourguild",
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

const createSchedule = ({ startTime, endTime, ...body }) =>
    new Promise(async (resolve, reject) => {
        try {
            const createSchedule = await db.Schedule.findOrCreate({
                where: {
                    [Op.and]: {
                        startTime: startTime,
                        endTime: endTime
                    },
                },
                defaults: {
                    startTime: startTime,
                    endTime: endTime,
                    ...body,
                },
            });

            resolve({
                status: createSchedule[1] ? 200 : 400,
                data: {
                    msg: createSchedule[1]
                        ? "Create new schedule successfully"
                        : "Cannot create new schedule/Schedule already exists",
                    schedule: createSchedule[1] ? createSchedule[0].dataValues : null,
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

const updateSchedule = ({ scheduleId, ...body }) =>
    new Promise(async (resolve, reject) => {
        try {
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

