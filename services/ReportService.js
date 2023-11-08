const db = require('../models');
const { Op, sequelize } = require('sequelize');
const REPORT_STATUS = require("../enums/ReportStatusEnum");
const { StatusCodes } = require('http-status-codes');

const getReports = async (req) => {
    try {
        const page = parseInt(req.query.page)
        const limit = parseInt(req.query.limit)
        const offset = (page - 1) * limit
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

        return{
            status: StatusCodes.OK,
            data: {
                msg: `Get reports successfully`,
                paging: {
                    page: page,
                    limit: limit,
                    total: totalReport
                },
                reports: reports,
            },
        }

    } catch (error) {
        console.error(error);
    }
}

const getReportsById = async (req) => {
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

        return{
            status: report ? StatusCodes.OK : StatusCodes.NOT_FOUND,
            data: report ? {
                msg: `Get report successfully`,
                report: report
            } : {
                msg: `No report found with Id: ${reportId}`,
            }
        }
    } catch (error) {
        console.error(error);
    }
}

const createReport = async (req) => {
    try {
        const customerId = req.body.customerId
        const title = req.body.title
        const description = req.body.description

        const loggedInUser = req.user.userId
        if(customerId !== loggedInUser){
            return{
                status: StatusCodes.NOT_FOUND,
                data: {
                    msg: `Cannot report using other account`
                }
            }
        }
        //check user
        const user = await db.User.findOne({
            where: {
                userId: customerId
            }
        })

        if (!user) {
            return{
                status: StatusCodes.NOT_FOUND,
                data: {
                    msg: `User not found!`
                }
            }
        }

        const setUpReport = { customerId: user.userId, title: title, description: description, reportStatus: REPORT_STATUS.SUBMITTED }
        const report = await db.Report.create(setUpReport);

        return{
            status: report ? StatusCodes.CREATED : StatusCodes.BAD_REQUEST,
            data: {
                msg: report ? 'Create report successfully' : 'Failed to create report',
                report: report
            }
        }
    } catch (error) {
        console.error(error);
    }
}

const updateReport = async (req) => {
    const t = await db.sequelize.transaction();
    try {
        const reportId = req.params.id || ""
        const response = req.body.response || ""
        const reportStatus = req.body.reportStatus || ""

        const updateReport = {}
        const report = await db.Report.findOne({
            where: {
                reportId: reportId
            }
        })

        if (!report) {
            return{
                status: StatusCodes.NOT_FOUND,
                data: {
                    msg: `Report not found!`,
                }
            }
        }

        if (response !== "") {
            updateReport.response = response
        }
        
        if (reportStatus !== "") {
            updateReport.reportStatus = reportStatus
        }

        await db.Report.update(updateReport, {
            where: {
                reportId: report.reportId
            },
            individualHooks: true,
            transaction: t
        })

        await t.commit()

        return{
            status: StatusCodes.OK,
            data: {
                msg: "Update report successfully",
            }
        }
    } catch (error) {
        await t.rollback()
        console.error(error);
    }
}

module.exports = { getReports, getReportsById, createReport, updateReport };