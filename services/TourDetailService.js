const db = require("../models");
const { Op } = require("sequelize");

const getAllTourDetail = (
    { page, limit, order, tourId, status, ...query },
    roleName
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
                queries.order = [['updatedAt', 'DESC']];
            }
            if (tourId) query.tourId = { [Op.eq]: tourId };
            if (status) query.status = { [Op.eq]: status };
            if (roleName !== "Admin") {
                query.status = { [Op.notIn]: ['Deactive'] };
            }
            const tourDetails = await db.TourDetail.findAll({
                where: query,
                ...queries,
                attributes: {
                    exclude: ["tourId", "stationId"],
                },
                include: [
                    {
                        model: db.Tour,
                        as: "detail_tour",
                        attributes: {
                            exclude: [
                                "createdAt",
                                "updatedAt",
                                "status",
                            ],
                        },
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
                status: tourDetails ? 200 : 404,
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

const updateTourDetail = ({ tourDetailId, ...body }) =>
    new Promise(async (resolve, reject) => {
        try {
            const tourDetails = await db.TourDetail.update(body, {
                where: { tourDetailId },
                individualHooks: true,
            });

            resolve({
                status: tourDetails[1].length !== 0 ? 200 : 400,
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