const db = require("../models");
const { Op } = require("sequelize");
const redisClient = require("../config/RedisConfig");

const getAllStation = (
    { page, limit, order, stationName, address, status, ...query },
    roleName
) =>
    new Promise(async (resolve, reject) => {
        try {
            redisClient.get(`stations_${page}_${limit}_${order}_${stationName}_${address}_${status}`, async (error, station) => {
                if (station != null && station != "" && roleName != 'Admin') {
                    resolve({
                        status: 200,
                        data: {
                            msg: "Got stations",
                            stations: JSON.parse(station),
                        }
                    });
                } else {
                    redisClient.get(`admin_stations_${page}_${limit}_${order}_${stationName}_${address}_${status}`, async (error, adminStation) => {
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
                            if (status) query.status = { [Op.eq]: status };
                            if (roleName !== "Admin") {
                                query.status = { [Op.notIn]: ['Deactive'] };
                            }
                            const stations = await db.Station.findAll({
                                where: query,
                                ...queries,
                            });

                            if (roleName !== "Admin") {
                                redisClient.setEx(`stations_${page}_${limit}_${order}_${stationName}_${address}_${status}`, 3600, JSON.stringify(stations));
                            } else {
                                redisClient.setEx(`admin_stations_${page}_${limit}_${order}_${stationName}_${address}_${status}`, 3600, JSON.stringify(stations));
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

const getStationById = (stationId) =>
    new Promise(async (resolve, reject) => {
        try {
            const station = await db.Station.findOne({
                where: { stationId: stationId },
                raw: true,
                nest: true,
                attributes: {
                    exclude: ["createdAt", "updatedAt"],
                }
            });
            resolve({
                status: station ? 200 : 404,
                data: {
                    msg: station ? "Got station" : `Cannot find station with id: ${stationId}`,
                    station: station,
                }
            });
        } catch (error) {
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

            resolve({
                status: createStation[1] ? 200 : 400,
                data: {
                    msg: createStation[1]
                        ? "Create new station successfully"
                        : "Cannot create new station/Station name already exists",
                    station: createStation[1] ? createStation[0].dataValues : null,
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
                    status: stations[1].length !== 0 ? 200 : 400,
                    data: {
                        msg:
                            stations[1].length !== 0
                                ? `Station update`
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
            const findStation = await db.Station.findAll({
                raw: true, nest: true,
                where: { stationId: stationIds },
            });

            for (const station of findStation) {
                if (station.status === "Deactive") {
                    resolve({
                        status: 400,
                        data: {
                            msg: "The station already deactive!",
                        }
                    });
                    return;
                }
            }

            const stations = await db.Station.update(
                { status: "Deactive" },
                {
                    where: { stationId: stationIds },
                    individualHooks: true,
                }
            );
            resolve({
                status: stations[0] > 0 ? 200 : 400,
                data: {
                    msg:
                        stations[0] > 0
                            ? `${stations[0]} station delete`
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
    getStationById
};

