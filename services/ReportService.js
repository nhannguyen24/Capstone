const db = require('../models');
const { Op, sequelize } = require('sequelize');
const REPORT_STATUS = require("../enums/ReportStatusEnum")

const getReports = (req) => new Promise(async (resolve, reject) => {
    try {
        const page = parseInt(req.query.page)
        const limit = parseInt(req.query.limit)
        const offset = parseInt((page - 1) * limit)
        const reportStatus = req.query.reportStatus || ""

        let whereClause = {}
        if (reportStatus !== "") {
            whereClause.reportStatus = reportStatus
        }

        const reports = await db.Report.findAll({
            order: [["updatedAt", "DESC"]],
            where: whereClause,
            include: [
                {
                    model: db.User,
                    as: "report_user",
                    attributes: ["userId", "userName"],
                },
            ],
            limit: limit,
            offset: offset
        });
        const totalReport = await db.Report.count({
            where: whereClause,
        });

        resolve({
            status: 200,
            data: {
                msg: `Get reports successfully`,
                paging: {
                    page: page,
                    limit: limit,
                    total: totalReport
                },
                reports: reports,
            },
        });

    } catch (error) {
        reject(error);
    }
});

const getReportsById = (req) => new Promise(async (resolve, reject) => {
    try {
        const reportId = req.params.id
        const report = await db.Report.findOne({
            where: {
                reportId: reportId
            },
            include: [
                {
                    model: db.User,
                    as: "report_user",
                    attributes: ["userId", "userName"]
                },
            ],
        });

        resolve({
            status: report ? 200 : 404,
            data: report ? {
                msg: `Get report successfully`,
                report: report
            } : {
                msg: `No report found with Id: ${reportId}`,
            }
        });

    } catch (error) {
        reject(error);
    }
});

const createReport = (req) => new Promise(async (resolve, reject) => {
    try {
        const customerId = req.body.customerId
        const title = req.body.title
        const description = req.body.description

        //check user
        const user = await db.User.findOne({
            where: {
                userId: customerId
            }
        })

        if (!user) {
            resolve({
                status: 404,
                data: {
                    msg: `User not found with id: "${customerId}",`
                }
            })
            return
        }

        const setUpReport = { customerId: user.userId, title: title, description: description, reportStatus: REPORT_STATUS.SUBMITTED }
        const report = await db.Report.create(setUpReport);

        resolve({
            status: report ? 201 : 400,
            data: {
                msg: report ? 'Create report successfully' : 'Failed to create report',
                report: report
            }
        });
    } catch (error) {
        reject(error);
    }
});

const updateReport = (req) => new Promise(async (resolve, reject) => {
    const t = await db.sequelize.transaction();
    try {
        const reportId = req.params.id
        const report = await db.Report.findOne({
            where: {
                reportId: reportId
            }
        })

        if (!report) {
            resolve({
                status: 404,
                data: {
                    msg: `Report not found with id ${reportId}`,
                }
            })
            return
        }

        var response = req.query.response
        if (response === undefined || response === null) {
            response = report.response
        }
        var reportStatus = req.query.reportStatus
        if (reportStatus === undefined || reportStatus === null) {
            reportStatus = report.reportStatus
        }

        await db.Report.update({
            response: response,
            reportStatus: reportStatus
        }, {
            where: {
                reportId: report.reportId
            },
            individualHooks: true,
            transaction: t
        })

        await t.commit()

        resolve({
            status: 200,
            data: {
                msg: "Update report successfully",
            }
        })

    } catch (error) {
        await t.rollback()
        reject(error);
    }
});

module.exports = { getReports, getReportsById, createReport, updateReport };