const db = require("../models");
const { Op } = require("sequelize");
const redisClient = require("../config/RedisConfig");
const STATUS = require("../enums/StatusEnum")
const { StatusCodes } = require("http-status-codes")
const { sendNotification } = require("../utils/NotificationUtil")

const getAllSchedule = (
    { page, limit, order, busId, tourId, tourGuideId, driverId, status, departureDate, endDate, ...query },
    roleName
) =>
    new Promise(async (resolve, reject) => {
        try {
            redisClient.get(`schedules_${page}_${limit}_${order}_${busId}_${tourId}_${tourGuideId}_${driverId}_${status}_${departureDate}_${endDate}`, async (error, schedule) => {
                if (error) console.error(error);
                if (schedule != null && schedule != "" && roleName != 'Admin') {
                    resolve({
                        status: StatusCodes.OK,
                        data: {
                            msg: "Got schedules",
                            schedules: JSON.parse(schedule),
                        }
                    });
                } else {
                    redisClient.get(`admin_schedules_${page}_${limit}_${order}_${busId}_${tourId}_${tourGuideId}_${driverId}_${status}_${departureDate}_${endDate}`, async (error, adminSchedule) => {
                        if (adminSchedule != null && adminSchedule != "") {
                            resolve({
                                status: StatusCodes.OK,
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
                            if (departureDate) {
                                const startTimeConvert = new Date(departureDate);
                                query.departureDate = { [Op.gte]: startTimeConvert };
                            }
                            if (endDate) {
                                const endTimeConvert = new Date(endDate);
                                query.endDate = { [Op.lte]: endTimeConvert };
                            }
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
                                                        "createdAt",
                                                        "updatedAt",
                                                        "status",
                                                    ],
                                                },
                                            },
                                        ]
                                    },
                                    {
                                        model: db.TourDetail,
                                        as: "schedule_detail",
                                        attributes: {
                                            exclude: [
                                                "createdAt",
                                                "updatedAt",
                                                "status",
                                            ],
                                        },
                                        include: [
                                            {
                                                model: db.Station,
                                                as: "tour_detail_station",
                                                attributes: {
                                                    exclude: [
                                                        "createdAt",
                                                        "updatedAt",
                                                        "status",
                                                    ],
                                                },
                                            },
                                        ]
                                    },
                                    {
                                        model: db.Station,
                                        as: "schedule_departure_station",
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
                                    {
                                        model: db.Tracking,
                                        as: "schedule_tracking",
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

                            if (roleName !== "Admin") {
                                redisClient.setEx(`schedules_${page}_${limit}_${order}_${busId}_${tourId}_${tourGuideId}_${driverId}_${status}_${departureDate}_${endDate}`, 3600, JSON.stringify(schedules));
                            } else {
                                redisClient.setEx(`admin_schedules_${page}_${limit}_${order}_${busId}_${tourId}_${tourGuideId}_${driverId}_${status}_${departureDate}_${endDate}`, 3600, JSON.stringify(schedules));
                            }
                            resolve({
                                status: StatusCodes.OK,
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
                                        "createdAt",
                                        "updatedAt",
                                        "status",
                                    ],
                                },
                            },
                        ]
                    },
                    {
                        model: db.TourDetail,
                        as: "schedule_detail",
                        attributes: {
                            exclude: [
                                "createdAt",
                                "updatedAt",
                                "status",
                            ],
                        },
                        include: [
                            {
                                model: db.Station,
                                as: "tour_detail_station",
                                attributes: {
                                    exclude: [
                                        "createdAt",
                                        "updatedAt",
                                        "status",
                                    ],
                                },
                            },
                        ]
                    },
                    {
                        model: db.Station,
                        as: "schedule_departure_station",
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
                    {
                        model: db.Tracking,
                        as: "schedule_tracking",
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
                status: StatusCodes.OK,
                data: {
                    msg: schedule.length > 0 ? "Got schedule" : `Cannot find schedule with id: ${scheduleId}`,
                    schedule: schedule,
                }
            });
        } catch (error) {
            reject(error);
        }
    });

const createSchedule = (body) =>
    new Promise(async (resolve, reject) => {
        let transaction;
        try {
            transaction = await db.sequelize.transaction(async (t) => {
                // Initialize the schedule
                const currentDate = new Date()
                currentDate.setHours(currentDate.getHours() + 7)

                const findScheduledTour = await db.Schedule.findAll({
                    raw: true, nest: true,
                    order: [['departureDate', 'ASC']],
                    where: {
                        status: {
                            [Op.ne]: STATUS.DEACTIVE,
                        },
                        [Op.and]: [
                            {
                                departureDate: {
                                    [Op.gte]: currentDate,
                                },
                            },
                            {
                                endDate: {
                                    [Op.gt]: currentDate,
                                },
                            }
                        ],
                        isScheduled: true,
                    },
                    attributes: {
                        exclude: [
                            "createdAt",
                            "updatedAt",
                        ]
                    },
                    include: [
                        {
                            model: db.Bus,
                            as: "schedule_bus",
                            attributes: [
                                "busId"
                            ]
                        },
                        {
                            model: db.User,
                            as: "schedule_tourguide",
                            attributes: [
                                "userId"
                            ]
                        },
                        {
                            model: db.User,
                            as: "schedule_driver",
                            attributes: [
                                "userId"
                            ]
                        },
                    ]
                })

                const findBusActive = await db.Bus.findAll({
                    raw: true, nest: true,
                    where: {
                        status: STATUS.ACTIVE
                    }
                })

                if (findBusActive.length == 0) {
                    resolve({
                        status: StatusCodes.BAD_REQUEST,
                        data: {
                            msg: 'There are no buses available'
                        }
                    })
                    return
                }

                const findTourguide = await db.User.findAll({
                    raw: true, nest: true,
                    attributes: ['userId', 'userName', 'email', 'maxTour', 'deviceToken'],
                    order: [['maxTour', 'DESC']],
                    include: [
                        {
                            model: db.Role,
                            as: "user_role",
                            where: {
                                roleName: 'TourGuide',
                                status: STATUS.ACTIVE,
                            }
                        }
                    ]
                })

                const findDriver = await db.User.findAll({
                    raw: true, nest: true,
                    attributes: ['userId', 'userName', 'email', 'maxTour', 'deviceToken'],
                    order: [['maxTour', 'DESC']],
                    include: [
                        {
                            model: db.Role,
                            as: "user_role",
                            where: {
                                roleName: 'Driver',
                                status: STATUS.ACTIVE,
                            }
                        }
                    ]
                })

                if (findTourguide.length == 0) {
                    resolve({
                        status: StatusCodes.BAD_REQUEST,
                        data: {
                            msg: 'There are no tour guide available'
                        }
                    })
                    return
                }

                if (findDriver.length == 0) {
                    resolve({
                        status: StatusCodes.BAD_REQUEST,
                        data: {
                            msg: 'There are no driver available'
                        }
                    })
                    return
                }

                const schedule = []
                if (findScheduledTour.length > 0) {
                    for (const tour of findScheduledTour) {
                        const tourGuide = tour.schedule_tourguide
                        const driver = tour.schedule_driver
                        const bus = tour.schedule_bus

                        schedule.push({ tour, tourGuide, driver, bus })
                    }
                }

                const findCurrentTourDuration = await db.Tour.findOne({
                    where: { tourId: body.tourId },
                    raw: true,
                    nest: true,
                    attributes: {
                        exclude: ["status", "createdAt", "updatedAt"],
                    }
                });

                let createSchedule, availableTourGuide, availableDriver, availableBuses;
                const BeforeTDepartureDate = new Date(body.departureDate)
                const tDepartureDate = new Date(body.departureDate)
                const [currentScheduleHours, currentScheduleMinutes, currentScheduleSeconds] = findCurrentTourDuration.duration.split(':').map(Number)

                // Add the duration to the tDepartureDate
                tDepartureDate.setHours(tDepartureDate.getHours() + currentScheduleHours)
                tDepartureDate.setMinutes(tDepartureDate.getMinutes() + currentScheduleMinutes)
                tDepartureDate.setSeconds(tDepartureDate.getSeconds() + currentScheduleSeconds)
                const tEndDate = tDepartureDate

                if (currentDate.getTime() + 24 * 60 * 60 * 1000 >= BeforeTDepartureDate.getTime()) {
                    resolve({
                        status: StatusCodes.BAD_REQUEST,
                        data: {
                            msg: "Departure date must be 24 hours latter than current date",
                        }
                    })
                    await t.rollback();
                    return
                } else {
                    // Find an available employee for the tour
                    availableTourGuide = findTourguide.filter(
                        (employee) =>
                            employee.maxTour > 0 &&
                            !schedule.some((assignment) => {
                                const departureDate = new Date(assignment.tour.departureDate)
                                const endDate = new Date(assignment.tour.endDate)

                                const beforeCurrentTourDepartureDate = new Date(body.departureDate)
                                const currentTourDepartureDate = new Date(body.departureDate)
                                const [currentTourHours, currentTourMinutes, currentTourSeconds] = findCurrentTourDuration.duration.split(':').map(Number)

                                // Add the duration to the departureDate
                                currentTourDepartureDate.setHours(currentTourDepartureDate.getHours() + currentTourHours)
                                currentTourDepartureDate.setMinutes(currentTourDepartureDate.getMinutes() + currentTourMinutes)
                                currentTourDepartureDate.setSeconds(currentTourDepartureDate.getSeconds() + currentTourSeconds)
                                const currentEndDate = currentTourDepartureDate

                                let checkTourGuide = true;
                                if (departureDate > currentEndDate && assignment.tourGuide?.userId === employee.userId) {
                                    checkTourGuide = false;
                                }

                                // Check if the tour guide is available
                                return (endDate >= beforeCurrentTourDepartureDate && assignment.tourGuide?.userId === employee.userId) && checkTourGuide;
                            })
                    );

                    availableDriver = findDriver.filter(
                        (employee) =>
                            employee.maxTour > 0
                            && !schedule.some((assignment) => {
                                const departureDate = new Date(assignment.tour.departureDate)
                                const endDate = new Date(assignment.tour.endDate)

                                const beforeCurrentTourDepartureDate = new Date(body.departureDate)
                                const currentTourDepartureDate = new Date(body.departureDate)
                                const [currentTourHours, currentTourMinutes, currentTourSeconds] = findCurrentTourDuration.duration.split(':').map(Number)

                                // Add the duration to the departureDate
                                currentTourDepartureDate.setHours(currentTourDepartureDate.getHours() + currentTourHours)
                                currentTourDepartureDate.setMinutes(currentTourDepartureDate.getMinutes() + currentTourMinutes)
                                currentTourDepartureDate.setSeconds(currentTourDepartureDate.getSeconds() + currentTourSeconds)
                                const currentEndDate = currentTourDepartureDate

                                let checkDriver = true;
                                if (departureDate > currentEndDate && assignment.driver?.userId === employee.userId) {
                                    checkDriver = false;
                                }

                                // // Check if the driver is available
                                return (endDate >= beforeCurrentTourDepartureDate && assignment.driver?.userId == employee.userId) && checkDriver;
                            })
                    );

                    availableBuses = findBusActive.filter(
                        (bus) =>
                            // bus.numberSeat >= 2 && 
                            !schedule.some((assignment) => {
                                const departureDate = new Date(assignment.tour.departureDate)
                                const endDate = new Date(assignment.tour.endDate)

                                const beforeCurrentTourDepartureDate = new Date(body.departureDate)
                                const currentTourDepartureDate = new Date(body.departureDate)
                                const [currentTourHours, currentTourMinutes, currentTourSeconds] = findCurrentTourDuration.duration.split(':').map(Number)

                                // Add the duration to the departureDate
                                currentTourDepartureDate.setHours(currentTourDepartureDate.getHours() + currentTourHours)
                                currentTourDepartureDate.setMinutes(currentTourDepartureDate.getMinutes() + currentTourMinutes)
                                currentTourDepartureDate.setSeconds(currentTourDepartureDate.getSeconds() + currentTourSeconds)
                                const currentEndDate = currentTourDepartureDate

                                let checkBus = true;
                                if (departureDate > currentEndDate && assignment.bus?.busId == bus.busId) {
                                    checkBus = false;
                                }

                                // Check if the bus is available
                                return (endDate >= beforeCurrentTourDepartureDate && assignment.bus?.busId == bus.busId) && checkBus;
                            })
                    );

                    let chosenTourGuide, chosenDriver, chosenBus;
                    if (availableTourGuide.length > 0 && availableDriver.length > 0 && availableBuses.length > 0) {
                        chosenTourGuide = availableTourGuide[0]
                        chosenDriver = availableDriver[0]
                        chosenTourGuide.maxTour--
                        chosenDriver.maxTour--
                        chosenBus = availableBuses[0]

                        createSchedule = await db.Schedule.create({
                            departureDate: BeforeTDepartureDate,
                            endDate: tEndDate,
                            departureStationId: body.departureStationId,
                            tourGuideId: chosenTourGuide.userId,
                            driverId: chosenDriver.userId,
                            busId: chosenBus.busId,
                            isScheduled: true,
                            tourId: body.tourId,
                        }, { transaction: t })

                        await db.User.update({
                            maxTour: chosenTourGuide.maxTour,
                        }, {
                            where: { userId: chosenTourGuide.userId },
                            individualHooks: true,
                            transaction: t
                        })

                        await db.User.update({
                            maxTour: chosenDriver.maxTour,
                        }, {
                            where: { userId: chosenDriver.userId },
                            individualHooks: true,
                            transaction: t
                        })

                        const createdDepartureDate = new Date(body.departureDate);

                        const formattedDate = createdDepartureDate.toLocaleString('en-GB', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                        });

                        const createNotiTourGuide = await db.Notification.create({
                            title: "Bạn có một chuyến đi mới",
                            body: `Chuyến tên ${findCurrentTourDuration.tourName} - ${formattedDate}`,
                            deviceToken: chosenTourGuide.deviceToken,
                            notiType: "Thông báo",
                            userId: chosenTourGuide.userId
                        }, { transaction: t })

                        if (createNotiTourGuide) {
                            sendNotification(
                                createNotiTourGuide.title,
                                createNotiTourGuide.body,
                                createNotiTourGuide.deviceToken,
                                createNotiTourGuide.notiType
                            );
                        };

                        const createNotiDriver = await db.Notification.create({
                            title: "Bạn có một chuyến đi mới",
                            body: `Chuyến tên ${findCurrentTourDuration.tourName} - ${formattedDate}`,
                            deviceToken: chosenDriver.deviceToken,
                            notiType: "Thông báo",
                            userId: chosenDriver.userId
                        }, { transaction: t })

                        if (createNotiDriver) {
                            sendNotification(
                                createNotiDriver.title,
                                createNotiDriver.body,
                                createNotiDriver.deviceToken,
                                createNotiDriver.notiType
                            );
                        };
                    }
                    else {
                        createSchedule = await db.Schedule.create({
                            departureDate: BeforeTDepartureDate,
                            endDate: tEndDate,
                            departureStationId: body.departureStationId,
                            tourId: body.tourId,
                        }, { transaction: t })
                    }

                    resolve({
                        status: createSchedule ? StatusCodes.OK : StatusCodes.BAD_REQUEST,
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
                    await t.commit();
                }
            })

        } catch (error) {
            if (transaction) {
                // Rollback the transaction in case of an error
                await transaction.rollback();
            }
            reject(error);
        }
    });

const updateSchedule = (id, body) =>
    new Promise(async (resolve, reject) => {
        try {
            const currentDate = new Date()
            currentDate.setHours(currentDate.getHours() + 7)

            const BeforeTDepartureDate = new Date(body.departureDate)
            const tDepartureDate = new Date(body.departureDate)
            const [currentScheduleHours, currentScheduleMinutes, currentScheduleSeconds] = body.duration.split(':').map(Number)

            // Add the duration to the tDepartureDate
            tDepartureDate.setHours(tDepartureDate.getHours() + currentScheduleHours)
            tDepartureDate.setMinutes(tDepartureDate.getMinutes() + currentScheduleMinutes)
            tDepartureDate.setSeconds(tDepartureDate.getSeconds() + currentScheduleSeconds)
            const tEndDate = tDepartureDate

            if (currentDate.getTime() + 24 * 60 * 60 * 1000 >= tDepartureDate.getTime()) {
                resolve({
                    status: StatusCodes.BAD_REQUEST,
                    data: {
                        msg: "Departure date must be 24 hours latter than current date",
                    }
                })
                await t.rollback();
                return
            } else {
                let tourGuide = body.tourGuideId
                let driver = body.driverId
                const findTour = await db.Tour.findOne({
                    raw: true, nest: true,
                    where: {
                        tourId: id
                    },
                })
                if (tourGuide) {
                    const findScheduledTourGuild = await db.Schedule.findAll({
                        raw: true, nest: true,
                        order: [['departureDate', 'ASC']],
                        where: {
                            [Op.and]: [
                                {
                                    departureDate: {
                                        [Op.gte]: body.departureDate,
                                    },
                                },
                                {
                                    endDate: {
                                        [Op.gt]: body.endDate,
                                    },
                                }
                            ],
                            isScheduled: true,
                            tourGuideId: body.tourGuideId
                        },
                    })
                    const checkDuplicatedTime = findScheduledTourGuild.some((assignment) => {
                        // const departureDate = new Date(assignment.departureDate)
                        // // Split the duration string into hours, minutes, and seconds
                        // const [hours, minutes, seconds] = assignment.duration.split(':').map(Number)

                        // // Add the duration to the departureDate
                        // departureDate.setHours(departureDate.getHours() + hours)
                        // departureDate.setMinutes(departureDate.getMinutes() + minutes)
                        // departureDate.setSeconds(departureDate.getSeconds() + seconds)
                        // const endDate = departureDate

                        // // Check if the tour guide is available
                        // return endDate >= findTour.departureDate

                        const departureDate = new Date(assignment.departureDate)
                        const endDate = new Date(assignment.endDate)

                        const beforeCurrentTourDepartureDate = new Date(body.departureDate)
                        const currentTourDepartureDate = new Date(body.departureDate)
                        const [currentTourHours, currentTourMinutes, currentTourSeconds] = body.duration.split(':').map(Number)

                        // Add the duration to the departureDate
                        currentTourDepartureDate.setHours(currentTourDepartureDate.getHours() + currentTourHours)
                        currentTourDepartureDate.setMinutes(currentTourDepartureDate.getMinutes() + currentTourMinutes)
                        currentTourDepartureDate.setSeconds(currentTourDepartureDate.getSeconds() + currentTourSeconds)
                        const currentEndDate = currentTourDepartureDate

                        let checkTourGuide = true;
                        if (departureDate > currentEndDate && assignment.tourGuide?.userId === employee.userId) {
                            checkTourGuide = false;
                        }
                        // Check if the tour guide is duplicated
                        return (endDate >= beforeCurrentTourDepartureDate && assignment.tourGuide?.userId === employee.userId) && checkTourGuide;
                    })

                    if (checkDuplicatedTime) {
                        resolve({
                            status: StatusCodes.BAD_REQUEST,
                            data: {
                                msg: "Tour guide time is duplicated",
                            }
                        })
                        return
                    }
                } else if (driver) {
                    const findScheduledDriver = await db.Tour.findAll({
                        raw: true, nest: true,
                        order: [['departureDate', 'ASC']],
                        where: {
                            departureDate: {
                                [Op.gte]: currentDate,
                            },
                            isScheduled: true,
                            driverId: body.driverId
                        },
                    })

                    const checkDuplicatedTime = findScheduledDriver.some((assignment) => {
                        const departureDate = new Date(assignment.departureDate)
                        // Split the duration string into hours, minutes, and seconds
                        const [hours, minutes, seconds] = assignment.duration.split(':').map(Number)

                        // Add the duration to the departureDate
                        departureDate.setHours(departureDate.getHours() + hours)
                        departureDate.setMinutes(departureDate.getMinutes() + minutes)
                        departureDate.setSeconds(departureDate.getSeconds() + seconds)
                        const endDate = departureDate

                        // Check if the tour guide is available
                        return endDate >= findTour.departureDate
                    })
                    if (checkDuplicatedTime) {
                        resolve({
                            status: StatusCodes.BAD_REQUEST,
                            data: {
                                msg: "Driver time is duplicated",
                            }
                        })
                        return
                    }
                }

                let departureStation = body.routeId
                let station
                if (departureStation) {
                    station = await db.Route.findOne({
                        raw: true,
                        nest: true,
                        where: {
                            routeId: departureStation
                        },
                        include: [
                            {
                                model: db.RouteSegment,
                                as: "route_segment",
                                where: {
                                    index: 1
                                }
                            },
                        ]
                    })
                }

                resolve({
                    status: schedules[1].length !== 0 ? StatusCodes.OK : StatusCodes.BAD_REQUEST,
                    data: {
                        msg:
                            schedules[1].length !== 0
                                ? `Schedule update`
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
            const findSchedule = await db.Schedule.findAll({
                raw: true, nest: true,
                where: { scheduleId: scheduleIds },
            });

            for (const schedulent of findSchedule) {
                if (schedulent.status === "Deactive") {
                    resolve({
                        status: StatusCodes.BAD_REQUEST,
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
                status: schedules[0] > 0 ? StatusCodes.OK : StatusCodes.BAD_REQUEST,
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

