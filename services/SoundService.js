const db = require("../models");
const { Op } = require("sequelize");
const redisClient = require("../config/RedisConfig");

const getAllFileSound = (
    { page, limit, order, status, poiId, languageId, ...query },
    roleName
) =>
    new Promise(async (resolve, reject) => {
        try {
            redisClient.get(`sounds_${page}_${limit}_${order}_${status}_${poiId}_${languageId}`, async (error, sound) => {
                if (sound != null && sound != "" && roleName != 'Admin') {
                    resolve({
                        status: 200,
                        data: {
                            msg: "Got sounds",
                            sounds: JSON.parse(sound),
                        }
                    });
                } else {
                    redisClient.get(`admin_sounds_${page}_${limit}_${order}_${status}_${poiId}_${languageId}`, async (error, adminFileSound) => {
                        if (adminFileSound != null && adminFileSound != "") {
                            resolve({
                                status: 200,
                                data: {
                                    msg: "Got sounds",
                                    sounds: JSON.parse(adminFileSound),
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
                            if (status) query.status = { [Op.eq]: status };
                            if (poiId) query.poiId = { [Op.eq]: poiId };
                            if (languageId) query.languageId = { [Op.eq]: languageId };
                            if (roleName !== "Admin") {
                                query.status = { [Op.notIn]: ['Deactive'] };
                            }
                            const sounds = await db.FileSound.findAll({
                                where: query,
                                ...queries,
                                attributes: {
                                    exclude: ["languageId", "poiId"],
                                },
                                include: [
                                    {
                                        model: db.Language,
                                        as: "sound_language",
                                        attributes: {
                                            exclude: [
                                                "createdAt",
                                                "updatedAt",
                                                "status",
                                            ],
                                        },
                                    },
                                    {
                                        model: db.PointOfInterest,
                                        as: "sound_point",
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

                            if (roleName !== "Admin") {
                                redisClient.setEx(`sounds_${page}_${limit}_${order}_${status}_${poiId}_${languageId}`, 3600, JSON.stringify(sounds));
                            } else {
                                redisClient.setEx(`admin_sounds_${page}_${limit}_${order}_${status}_${poiId}_${languageId}`, 3600, JSON.stringify(sounds));
                            }
                            resolve({
                                status: sounds ? 200 : 404,
                                data: {
                                    msg: sounds ? "Got sounds" : "Cannot find sounds",
                                    sounds: sounds,
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

const getFileSoundById = (soundId) =>
    new Promise(async (resolve, reject) => {
        try {
            const sound = await db.FileSound.findOne({
                where: { soundId: soundId },
                raw: true,
                nest: true,
                attributes: {
                    exclude: ["languageId", "poiId"],
                },
                include: [
                    {
                        model: db.Language,
                        as: "sound_language",
                        attributes: {
                            exclude: [
                                "createdAt",
                                "updatedAt",
                                "status",
                            ],
                        },
                    },
                    {
                        model: db.PointOfInterest,
                        as: "sound_point",
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
                status: sound ? 200 : 404,
                data: {
                    msg: sound ? "Got sound" : `Cannot find sound with id: ${soundId}`,
                    sound: sound,
                }
            });
        } catch (error) {
            reject(error);
        }
    });

const createFileSound = (body) =>
    new Promise(async (resolve, reject) => {
        try {
            const findLanguage = await db.Language.findOne({
                where: {
                    languageId: body.languageId
                }
            });
            if (!findLanguage) {
                resolve({
                    status: 400,
                    data: {
                        msg: "Language not found!"
                    }
                });
            }

            const findPoint = await db.PointOfInterest.findOne({
                where: {
                    poiId: body.poiId
                }
            });
            if (!findPoint) {
                resolve({
                    status: 400,
                    data: {
                        msg: "Point of interest not found!"
                    }
                });
            }

            const createFileSound = await db.FileSound.create(body);

            resolve({
                status: 200,
                data: {
                    msg: "Create new sound for point of interest successfully",
                    sound: createFileSound.dataValues,
                }
            });
            redisClient.keys('*sounds_*', (error, keys) => {
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

            redisClient.keys('*pois_*', (error, keys) => {
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
            resolve({
                status: 400,
                data: {
                    error: error,
                    msg: "Create new sound for point of interest unsuccessfully!"
                }
            });
            reject(error);
        }
    });

const updateFileSound = (body) =>
    new Promise(async (resolve, reject) => {
        try {
            const findLanguage = await db.Language.findOne({
                where: {
                    languageId: body.languageId
                }
            });
            if (!findLanguage) {
                resolve({
                    status: 400,
                    data: {
                        msg: "Language not found!"
                    }
                });
            }

            const findPoint = await db.PointOfInterest.findOne({
                where: {
                    poiId: body.poiId
                }
            });
            if (!findPoint) {
                resolve({
                    status: 400,
                    data: {
                        msg: "Point of interest not found!"
                    }
                });
            }

            const sounds = await db.FileSound.update(body, {
                where: { soundId: body.soundId },
                individualHooks: true,
            });

            resolve({
                status: sounds[1].length !== 0 ? 200 : 400,
                data: {
                    msg:
                        sounds[1].length !== 0
                            ? `File sound update`
                            : "Cannot update file sound/ soundId not found",
                }
            });

            redisClient.keys('*sounds_*', (error, keys) => {
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

            redisClient.keys('*pois_*', (error, keys) => {
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

const deleteFileSound = (soundId) =>
    new Promise(async (resolve, reject) => {
        try {
            const findSound = await db.FileSound.findOne({
                raw: true, nest: true,
                where: { soundId: soundId },
            });

            if (findSound.status === "Deactive") {
                resolve({
                    status: 400,
                    data: {
                        msg: "The sound already deactive!",
                    }
                });
                return;
            }

            const sounds = await db.FileSound.update(
                { status: "Deactive" },
                {
                    where: { soundId: soundId },
                    individualHooks: true,
                }
            );
            resolve({
                status: sounds[0] > 0 ? 200 : 400,
                data: {
                    msg:
                        sounds[0] > 0
                            ? `${sounds[0]} sound delete`
                            : "Cannot delete sound/ soundId not found",
                }
            });

            redisClient.keys('*sounds_*', (error, keys) => {
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
            
            redisClient.keys('*pois_*', (error, keys) => {
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
    updateFileSound,
    deleteFileSound,
    createFileSound,
    getAllFileSound,
    getFileSoundById,
};

