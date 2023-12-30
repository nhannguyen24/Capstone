const db = require("../models");
const { Op } = require("sequelize");
const { StatusCodes } = require("http-status-codes");

const getAllTourDetail = (
    { page, limit, order, scheduleId, status, ...query }
) =>
    new Promise(async (resolve, reject) => {
        try {
            const queries = { nest: true };
            const offset = !page || +page <= 1 ? 0 : +page - 1;
            const flimit = +limit || +process.env.LIMIT_POST;
            queries.offset = offset * flimit;
            queries.limit = flimit;
            if (order) queries.order = [[order]]
            else {
                queries.order = [['index', 'ASC']];
            }
            if (scheduleId) query.scheduleId = { [Op.eq]: scheduleId };
            if (status) query.status = { [Op.eq]: status };
            const tourDetails = await db.TourDetail.findAll({
                where: query,
                ...queries,
                attributes: {
                    exclude: ["scheduleId", "stationId"],
                },
                include: [
                    {
                        model: db.Schedule,
                        as: "detail_schedule",
                        attributes: {
                            exclude: [
                                "createdAt",
                                "updatedAt",
                                "status",
                            ],
                        },
                        include: [
                            {
                                model: db.Tour,
                                as: 'schedule_tour',
                                attributes: {
                                    exclude: [
                                        "geoJson",
                                        "createdAt",
                                        "updatedAt",
                                        "status",
                                    ],
                                },
                            }
                        ]
                    },
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
                    }
                ]
            });

            resolve({
                status: StatusCodes.OK,
                data: {
                    msg: tourDetails ? "Got tourDetails" : "Cannot find tourDetails",
                    tourDetails: tourDetails,
                }
            });
        } catch (error) {
            console.log(error);
            reject(error);
        }
    });

const updateTourDetail = (id, body) =>
    new Promise(async (resolve, reject) => {
        try {
            const tourDetails = await db.TourDetail.update(body, {
                where: { tourDetailId: id },
                individualHooks: true,
            });

            resolve({
                status: tourDetails[1].length !== 0 ? StatusCodes.OK : StatusCodes.BAD_REQUEST,
                data: {
                    msg:
                        tourDetails[1].length !== 0
                            ? `TourDetail update`
                            : "Cannot update tourDetail/ tourDetailId not found",
                }
            });

        } catch (error) {
            reject(error.message);
        }
    });

module.exports = {
    updateTourDetail,
    getAllTourDetail
};