const db = require('../models');
const { Op } = require('sequelize');
const STATUS = require("../enums/StatusEnum")

const getStatistics = () => new Promise(async (resolve, reject) => {
    try {


        resolve({
            status: bus ? 200 : 404,
            data: bus ? {
                msg: `Get bus successfully`,
                bus: bus
            } : {
                msg: `Bus not found`,
                bus: {}
            }
        });
    } catch (error) {
        reject(error);
    }
});

module.exports = { getStatistics };