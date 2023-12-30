const db = require("../models");
const { Op } = require("sequelize");
const { StatusCodes } = require("http-status-codes");

const getAllTracking = (
    { scheduleId, busId, status, ...query }
) =>
    new Promise(async (resolve, reject) => {
        try {
            const queries = { nest: true };
            queries.order = [['updatedAt', 'DESC']];
            if (scheduleId) query.scheduleId = { [Op.eq]: scheduleId };
            if (busId) query.busId = { [Op.eq]: busId };
            if (status) query.status = { [Op.eq]: status };
            query.status = { [Op.notIn]: ['Deactive'] };
            const trackings = await db.Tracking.findAll({
                where: query,
                ...queries,
            });
            resolve({
                status: StatusCodes.OK,
                data: {
                    msg: trackings ? "Got trackings" : "Cannot find trackings",
                    trackings: trackings,
                }
            });

        } catch (error) {
            console.log(error);
            reject(error);
        }
    });

const createTracking = (body) =>
    new Promise(async (resolve, reject) => {
        try {
            let arrayCoordinate = [];
            let latitude = body.latitude;
            let longitude = body.longitude;

            const duplicateSchedule = await db.Tracking.findOne({
                raw: true,
                where: {
                    scheduleId: body.scheduleId
                }
            });
            if (duplicateSchedule) {
                resolve({
                    status: StatusCodes.OK,
                    data: {
                        msg: `Schedule Id for this tracking has already exist!`,
                    }
                });
            } else {
                arrayCoordinate.push([latitude, longitude]);
                let coordinates = {
                    coordinates: arrayCoordinate
                };

                const bus = await db.Schedule.findOne({
                    raw: true,
                    attributes: ['scheduleId', 'busId'],
                    where: {
                        scheduleId: body.scheduleId
                    }
                });

                const createTracking = await db.Tracking.create({ coordinates, busId: bus.busId, scheduleId: body.scheduleId })
                resolve({
                    status: StatusCodes.OK,
                    data: {
                        msg: "Tracking create successfully!",
                        tracking: createTracking.dataValues,
                    }
                });
            }
        } catch (error) {
            resolve({
                status: StatusCodes.BAD_REQUEST,
                data: {
                    msg: error.message,
                }
            });
            // reject(error.message);
        }
    });

const updateTracking = (id, body) =>
    new Promise(async (resolve, reject) => {
        try {
            const tracking = await db.Tracking.findOne({
                raw: true,
                where: {
                    trackingId: id
                }
            });

            if (!tracking) {
                resolve({
                    status: StatusCodes.BAD_REQUEST,
                    data: {
                        msg: `Tracking not found!`,
                    }
                });
                return;
            }

            let arrayCoordinate = [];
            let latitude = body.latitude;
            let longitude = body.longitude;

            const coordinate = tracking.coordinates.coordinates;
            arrayCoordinate.push(latitude, longitude);
            coordinate.push(arrayCoordinate);
            let coordinateAfter = {
                coordinates: coordinate
            };

            await db.Tracking.update({ coordinates: coordinateAfter, ...body }, {
                where: { trackingId: id },
                individualHooks: true,
            });

            resolve({
                status: StatusCodes.OK,
                data: {
                    msg: `Tracking update successfully`,
                }
            });

        } catch (error) {
            resolve({
                status: StatusCodes.BAD_REQUEST,
                data: {
                    msg: error.message,
                }
            });
            // reject(error.message);
        }
    });

module.exports = {
    createTracking,
    getAllTracking,
    updateTracking,
};

