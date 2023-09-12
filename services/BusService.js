const db = require('../models');
const { Op } = require('sequelize');

const getAllBuses = (req) => new Promise(async (resolve, reject) => {
    try {
        var busPlate = req.query.busPlate
        if(busPlate === undefined || busPlate === null){
            busPlate = ""
        }

        const buses = await db.Bus.findAll({
            where: { 
                busPlate: { 
                    [Op.substring]: busPlate 
                } 
            },
        });

        if(buses.length > 0){
            resolve({
                status: 200,
                data: {
                    msg: `Bus found`,
                    buses: buses
                }
            });
        }

        resolve({
            status: 400,
            data: {
                msg: `Bus not found`,
                buses: []
            }
        });
    } catch (error) {
        reject(error);
    }
});

const createBus = (req) => new Promise(async (resolve, reject) => {
    try {
        const busPlate = req.body.busPlate
        const seat = req.body.numberSeat
        const [bus, created] = await db.Bus.findOrCreate({
            where: { busPlate: busPlate },
            defaults: { busPlate: busPlate, numberSeat: seat }
        });

        resolve({
            status: created ? 201 : 400,
            data: {
                msg: created ? 'Bus created' : 'Bus already exists',
                bus: bus
            }
        });
    } catch (error) {
        reject(error);
    }
});

const updateBus = (req) => new Promise(async (resolve, reject) => {
    const t = await db.sequelize.transaction();
    try {
        const busId = req.params.busId

        const bus = await db.Bus.findOne({
            where: {
                busId: busId
            }
        })

        if(!bus){
            resolve({
                status: 400,
                data: {
                    msg: `Bus not found with id ${busId}`,
                }
            })
        }

        var busPlate = req.query.busPlate
        if(busPlate === undefined || busPlate === null){
            busPlate = bus.busPlate
        }
        var seat = req.query.numberSeat
        if(seat === undefined || seat === null){
            seat = bus.numberSeat
        }
        var status = req.query.status
        if(status === undefined || status === null){
            status = bus.status
        }

        const result = await db.Bus.update({
            busPlate: busPlate,
            numberSeat: seat,
            status: status
        },{
            where: {
                busId: bus.busId
            }, transaction: t
        })

        await t.commit()

        resolve({
            status: 200,
            data: {
                msg: "Update bus success",
            }
        })

    } catch (error) {
        await t.rollback()
        reject(error);
    }
});
module.exports = { getAllBuses, createBus, updateBus };