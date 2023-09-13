const db = require('../models');
const { Op } = require('sequelize');

const getAllBusCates = (req) => new Promise(async (resolve, reject) => {
    try {
        const busCates = await db.BusCategory.findAll();
        resolve({
            status: 200,
            data: busCates.length > 0 ?
                {
                    msg: `Bus categories found`,
                    busCates: busCates
                } : {
                    msg: `No bus categories found`,
                    busCates: []
                }
        });
    } catch (error) {
        reject(error);
    }
});

const createBusCate = (req) => new Promise(async (resolve, reject) => {
    try {
        const busCateName = req.query.busCateName

        const [busCate, created] = await db.BusCategory.findOrCreate({
            where: { busCateName: busCateName },
            defaults: { busCateName: busCateName }
        });

        resolve({
            status: created ? 201 : 400,
            data: created ? {
                msg: 'Create bus category successfully',
                busCate: busCate
            } : {
                msg: 'Bus category already exists',
                busCate: []
            }
        });
    } catch (error) {
        reject(error);
    }
});

const updateBusCate = (req) => new Promise(async (resolve, reject) => {
    const t = await db.sequelize.transaction();
    try {
        const busCateId = req.params.busCateId
        const busCate = await db.BusCategory.findOne({
            where: {
                busCateId: busCateId
            }
        })

        if (!busCate) {
            resolve({
                status: 400,
                data: {
                    msg: `Bus category not found with id ${busCateId}`,
                }
            })
        }

        var busCateName = req.query.busCateName
        if (busCateName === undefined || busCateName === null) {
            busCateName = busCate.busCateName
        }

        var status = req.query.status
        if (status === undefined || status === null) {
            status = busCate.status
        }
        if("Deactive" == status){
            const bus = await db.Bus.findAll({
                where: {
                    busCateId: busCateId,
                    status: {
                        [Op.like]: "Active"
                    }
                },
            })
    
            if (bus.length > 0) {
                resolve({
                    status: 409,
                    data: {
                        msg: `Cannot update bus category status to Deactive because there are active buses with this category`,
                    }
                })
            }
        }

        await db.BusCategory.update({
            busCateName: busCateName,
        }, {
            where: {
                busCateId: busCate.busCateId
            }, transaction: t
        })

        await t.commit()

        resolve({
            status: 200,
            data: {
                msg: "Update bus category successfully",
            }
        })

    } catch (error) {
        await t.rollback()
        reject(error);
    }
});

const deleteBusCate = (req) => new Promise(async (resolve, reject) => {
    try {
        const busCateId = req.params.busCateId

        const busCate = await db.BusCategory.findOne({
            where: {
                busCateId: busCateId
            }
        })

        if (!busCate) {
            resolve({
                status: 400,
                data: {
                    msg: `Bus category not found with id ${busCateId}`,
                }
            })
        }

        const bus = await db.Bus.findAll({
            where: {
                busCateId: busCateId,
                status: {
                    [Op.like]: "Active"
                }
            },
        })

        if (bus) {
            resolve({
                status: 409,
                data: {
                    msg: `Cannot delete bus category because there are active buses with this category`,
                    buses: bus
                }
            })
        }

        await db.BusCategory.update({
            status: "Deactive"
        }, {
            where: {
                busCateId: busCate.busCateId
            }
        })

        resolve({
            status: 200,
            data: {
                msg: "Delete bus category successfully",
            }
        })


    } catch (error) {
        reject(error);
    }
});


module.exports = { getAllBusCates, createBusCate, updateBusCate, deleteBusCate };