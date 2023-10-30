const db = require("../models");
const { Op } = require("sequelize");

const getAllLanguage = (
    { page, limit, order, language, address, status, ...query },
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
            if (language) query.language = { [Op.substring]: language };
            if (status) query.status = { [Op.eq]: status };
            if (roleName !== "Admin") {
                query.status = { [Op.notIn]: ['Deactive'] };
            }
            const languages = await db.Language.findAll({
                where: query,
                ...queries,
            });

            resolve({
                status: languages ? 200 : 404,
                data: {
                    msg: languages ? "Got languages" : "Cannot find languages",
                    languages: languages,
                }
            });
        } catch (error) {
            console.log(error);
            reject(error);
        }
    });

const getLanguageById = (languageId) =>
    new Promise(async (resolve, reject) => {
        try {
            const language = await db.Language.findOne({
                where: { languageId: languageId },
                raw: true,
                nest: true,
                attributes: {
                    exclude: ["createdAt", "updatedAt"],
                }
            });
            resolve({
                status: language ? 200 : 404,
                data: {
                    msg: language ? "Got language" : `Cannot find language with id: ${languageId}`,
                    language: language,
                }
            });
        } catch (error) {
            reject(error);
        }
    });

const createLanguage = ({ language, ...body }) =>
    new Promise(async (resolve, reject) => {
        try {
            const createLanguage = await db.Language.findOrCreate({
                where: {
                    language: language
                },
                defaults: {
                    language: language,
                    ...body,
                },
            });

            resolve({
                status: createLanguage[1] ? 200 : 400,
                data: {
                    msg: createLanguage[1]
                        ? "Create new language successfully"
                        : "Cannot create new language/Language name already exists",
                    language: createLanguage[1] ? createLanguage[0].dataValues : null,
                }
            });

        } catch (error) {
            reject(error);
        }
    });

const updateLanguage = ({ languageId, ...body }) =>
    new Promise(async (resolve, reject) => {
        try {
            const language = await db.Language.findOne({
                where: {
                    language: body?.language,
                    languageId: {
                        [Op.ne]: languageId
                    }
                }
            })

            if (language !== null) {
                resolve({
                    status: 409,
                    data: {
                        msg: "Language name already exists"
                    }
                });
            } else {
                const languages = await db.Language.update(body, {
                    where: { languageId },
                    individualHooks: true,
                });

                resolve({
                    status: languages[1].length !== 0 ? 200 : 400,
                    data: {
                        msg:
                            languages[1].length !== 0
                                ? `Language update`
                                : "Cannot update language/ languageId not found",
                    }
                });
            }

        } catch (error) {
            reject(error.message);
        }
    });

const deleteLanguage = (languageId) =>
    new Promise(async (resolve, reject) => {
        try {
            const findLanguage = await db.Language.findOne({
                raw: true, nest: true,
                where: { languageId: languageId },
            });

            if (findLanguage.status === "Deactive") {
                resolve({
                    status: 400,
                    data: {
                        msg: "The language already deactive!",
                    }
                });
                return;
            }

            const languages = await db.Language.update(
                { status: "Deactive" },
                {
                    where: { languageId: languageId },
                    individualHooks: true,
                }
            );
            resolve({
                status: languages[0] > 0 ? 200 : 400,
                data: {
                    msg:
                        languages[0] > 0
                            ? `${languages[0]} language delete`
                            : "Cannot delete language/ languageId not found",
                }
            });

        } catch (error) {
            reject(error);
        }
    });

module.exports = {
    updateLanguage,
    deleteLanguage,
    createLanguage,
    getAllLanguage,
    getLanguageById
};

