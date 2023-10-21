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

const createTracking = ({ trackingId, ...body }) =>
    new Promise(async (resolve, reject) => {
        try {
            const tracking = await db.Tracking.findOne({
                where: {
                    trackingId: trackingId
                }
            });
            // console.log(tracking);

            let arrayCoordinate = [];
            let latitude = body.latitude;
            let longitude = body.longitude;

            if (tracking == null) {
                arrayCoordinate.push([latitude, longitude]);
                let coordinates = {
                    coordinates: arrayCoordinate
                };
                console.log(coordinates);

                const bus = await db.Tour.findOne({
                    raw: true,
                    attributes: ['busId'],
                    where: {
                        tourId: body.tourId
                    }
                });
                console.log(bus);

                await db.Tracking.create({coordinates, busId: bus.busId, ...body})
                // resolve({
                //     status: 409,
                //     data: {
                //         msg: "Tracking not found!"
                //     }
                // });
            } else {
                // if () {

                // }
                // const trackings = await db.Tracking.update(body, {
                //     where: { trackingId },
                //     individualHooks: true,
                // });

                // resolve({
                //     status: trackings[1].length !== 0 ? 200 : 400,
                //     data: {
                //         msg:
                //             trackings[1].length !== 0
                //                 ? `Tracking update`
                //                 : "Cannot update tracking/ trackingId not found",
                //     }
                // });
                console.log('lol');

            }
        } catch (error) {
            reject(error.message);
        }
    });

module.exports = {
    createTracking,
    getAllTracking,
};

