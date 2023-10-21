const db = require("../models");
const { Op } = require("sequelize");
const redisClient = require("../config/RedisConfig");

const getAllTracking = (
    { tourId, busId, status, ...query },
    roleName
) =>
    new Promise(async (resolve, reject) => {
        try {
            const queries = { nest: true };
            // const offset = !page || +page <= 1 ? 0 : +page - 1;
            // const flimit = +limit || +process.env.LIMIT_POST;
            // queries.offset = offset * flimit;
            // queries.limit = flimit;
            queries.order = [['updatedAt', 'DESC']];
            if (tourId) query.tourId = { [Op.eq]: tourId };
            if (busId) query.busId = { [Op.eq]: busId };
            if (status) query.status = { [Op.eq]: status };
            if (roleName !== "Admin" && roleName !== "Manager") {
                query.status = { [Op.notIn]: ['Deactive'] };
            }
            const trackings = await db.Tracking.findAll({
                where: query,
                ...queries,
            });
            resolve({
                status: trackings ? 200 : 404,
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

            const duplicateTour = await db.Tracking.findOne({
                raw: true,
                where: {
                    tourId: body.tourId
                }
            });
            if (duplicateTour) {
                resolve({
                    status: 200,
                    data: {
                        msg: `Tour Id has already exist!`,
                    }
                });
            } else {
                arrayCoordinate.push([latitude, longitude]);
                let coordinates = {
                    coordinates: arrayCoordinate
                };

                const bus = await db.Tour.findOne({
                    raw: true,
                    attributes: ['busId'],
                    where: {
                        tourId: body.tourId
                    }
                });

                await db.Tracking.create({ coordinates, busId: bus.busId, ...body })
                resolve({
                    status: 200,
                    data: {
                        msg: "Tracking create successfully!"
                    }
                });
            }
        } catch (error) {
            resolve({
                status: 400,
                data: {
                    msg: error.message,
                }
            });
            // reject(error.message);
        }
    });

const updateTracking = ({ trackingId, ...body }) =>
    new Promise(async (resolve, reject) => {
        try {
            const tracking = await db.Tracking.findOne({
                raw: true,
                where: {
                    trackingId: trackingId
                }
            });

            if (!tracking) {
                resolve({
                    status: 400,
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
                where: { trackingId },
                individualHooks: true,
            });

            resolve({
                status: 200,
                data: {
                    msg: `Tracking update successfully`,
                }
            });

        } catch (error) {
            resolve({
                status: 400,
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

