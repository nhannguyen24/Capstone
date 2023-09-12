const db = require("../models");
const { Op } = require("sequelize");
const redisClient = require("../config/RedisConfig");

const getAllStation = (
    { page, limit, order, stationName, address, stationId, ...query },
    roleName
) =>
    new Promise(async (resolve, reject) => {
        try {
            redisClient.get(`stations_${page}_${limit}_${order}_${stationName}_${address}_${stationId}`, async (error, station) => {
                if (error) console.error(error);
                if (station != null && station != "" && roleName != 'Admin') {
                    resolve({
                        status: 200,
                        data: {
                            msg: "Got stations",
                            stations: JSON.parse(station),
                        }
                    });
                } else {
                    redisClient.get(`admin_stations_${page}_${limit}_${order}_${stationName}_${address}_${stationId}`, async (error, adminStation) => {
                        if (adminStation != null && adminStation != "") {
                            resolve({
                                status: 200,
                                data: {
                                    msg: "Got stations",
                                    stations: JSON.parse(adminStation),
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
                            if (stationName) query.stationName = { [Op.substring]: stationName };
                            if (address) query.address = { [Op.substring]: address };
                            if (stationId) query.stationId = { [Op.eq]: stationId };
                            if (roleName !== "Admin") {
                                query.status = { [Op.notIn]: ['Deactive'] };
                            }
                            const stations = await db.Station.findAll({
                                where: query,
                                ...queries,
                                attributes: {
                                    exclude: ["createdAt", "updatedAt"],
                                },
                            });

                            if (roleName !== "Admin") {
                                redisClient.setEx(`stations_${page}_${limit}_${order}_${stationName}_${address}_${stationId}`, 3600, JSON.stringify(stations));
                            } else {
                                redisClient.setEx(`admin_stations_${page}_${limit}_${order}_${stationName}_${address}_${stationId}`, 3600, JSON.stringify(stations));
                            }
                            resolve({
                                status: stations ? 200 : 404,
                                data: {
                                    msg: stations ? "Got stations" : "Cannot find stations",
                                    stations: stations,
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

const createStation = ({ stationName, ...body }) =>
    new Promise(async (resolve, reject) => {
        try {
            const createStation = await db.Station.findOrCreate({
                where: {
                    stationName: stationName
                },
                defaults: {
                    stationName: stationName,
                    ...body,
                },
            });

            const station = await db.Station.findOne({
                where: {
                    stationId: createStation[0].stationId
                },
                attributes: {
                    exclude: ["createdAt", "updatedAt"],
                },
            })

            resolve({
                status: createStation[1] ? 200 : 400,
                data: {
                    msg: createStation[1]
                        ? "Create new station successfully"
                        : "Cannot create new station/Station already exists",
                    station: createStation[1] ? station : null,
                }
            });
            redisClient.keys('*stations_*', (error, keys) => {
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

const updateStation = ({ stationId, ...body }) =>
    new Promise(async (resolve, reject) => {
        try {
            const station = await db.Station.findOne({
                where: {
                    stationName: body?.stationName,
                    stationId: {
                        [Op.ne]: stationId
                    }
                }
            })

            if (station !== null) {
                resolve({
                    status: 409,
                    data: {
                        msg: "Station name already exists"
                    }
                });
            } else {
                const stations = await db.Station.update(body, {
                    where: { stationId },
                    individualHooks: true,
                });

                resolve({
                            status: stations[0] > 0 ? 200 : 400,
                    data: {
                        msg:
                        stations[0] > 0
                            ? `${stations[0]} station update`
                            : "Cannot update station/ stationId not found",
                    }
                });

                redisClient.keys('*stations_*', (error, keys) => {
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


const deleteStation = (stationIds) =>
    new Promise(async (resolve, reject) => {
        try {
            const stations = await db.Station.update(
                { status: "Deactive" },
                {
                    where: { stationId: stationIds },
                    individualHooks: true,
                }
            );
            resolve({
                status: stations > 0 ? 200 : 400,
                data: {
                    msg:
                    stations > 0
                        ? `${stations} station delete`
                        : "Cannot delete station/ stationId not found",
                }
            });

            redisClient.keys('*stations_*', (error, keys) => {
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
    updateStation,
    deleteStation,
    createStation,
    getAllStation,

};

