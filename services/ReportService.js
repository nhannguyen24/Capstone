const db = require('../models')
const { Op, sequelize } = require('sequelize')
const REPORT_STATUS = require("../enums/ReportStatusEnum")
const { StatusCodes } = require('http-status-codes')

const getReports = async (req) => {
    try {
        const page = parseInt(req.query.page)
        const limit = parseInt(req.query.limit)
        const offset = (page - 1) * limit
        const reportUserId = req.query.reportUserId || ""
        const tourId = req.query.tourId || ""
        const reportStatus = req.query.reportStatus || ""

        let whereClause = {}
        let whereClauseTour = {}
        if (reportUserId !== "") {
            whereClause.reportUserId = reportUserId.trim()
        }
        if (tourId !== "") {
            whereClauseTour.tourId = tourId.trim()
        }
        if (reportStatus !== "") {
            whereClause.reportStatus = reportStatus.trim()
        }

        const reports = await db.Report.findAll({
            order: [["updatedAt", "DESC"]],
            where: whereClause,
            include: [
                {
                    model: db.User,
                    as: "report_user",
                    attributes: ["userId", "userName"],
                    include: {
                        model: db.Role,
                        as: "user_role",
                        attributes: ["roleId", "roleName"],
                    }
                },
                {
                    model: db.User,
                    as: "response_user",
                    attributes: ["userId", "userName"],
                    include: {
                        model: db.Role,
                        as: "user_role",
                        attributes: ["roleId", "roleName"],
                    }
                },
                {
                    model: db.Schedule,
                    as: "report_schedule",
                    where: whereClauseTour,
                    include: {
                        model: db.Tour,
                        as: "schedule_tour",
                        attributes: ["tourName"]
                    }
                }
            ],
            attributes: {
                exclude: ["reportUserId", "responseUserId"]
            },
            limit: limit,
            offset: offset
        })
        const totalReport = await db.Report.count({
            where: whereClause,
            include: [
                {
                    model: db.Schedule,
                    as: "report_schedule",
                    where: whereClauseTour,
                }
            ],
        })

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
            }
        }

    } catch (error) {
        console.error(error)
        return {
            status: StatusCodes.INTERNAL_SERVER_ERROR,
            data:{
                msg: "An error has occurred!",
            }
        }
    }
}

const getReportsById = async (reportId) => {
    try {
        const report = await db.Report.findOne({
            where: {
                reportId: reportId
            },
            include: [
                {
                    model: db.User,
                    as: "report_user",
                    attributes: ["userId", "userName"],
                    include: {
                        model: db.Role,
                        as: "user_role",
                        attributes: ["roleId", "roleName"],
                    }
                },
                {
                    model: db.User,
                    as: "response_user",
                    attributes: ["userId", "userName"],
                    include: {
                        model: db.Role,
                        as: "user_role",
                        attributes: ["roleId", "roleName"],
                    }
                },
                {
                    model: db.Schedule,
                    as: "report_schedule",
                    include: {
                        model: db.Tour,
                        as: "schedule_tour",
                        attributes: ["tourName"]
                    }
                }
            ],
            attributes: {
                exclude: ["reportUserId", "responseUserId"]
            },
        })

        return{
            status: report ? StatusCodes.OK : StatusCodes.NOT_FOUND,
            data: report ? {
                msg: `Get report successfully`,
                report: report
            } : {
                msg: `Report not found!`,
                report: {}
            }
        }
    } catch (error) {
        console.error(error)
        return {
            status: StatusCodes.INTERNAL_SERVER_ERROR,
            data:{
                msg: "An error has occurred!",
            }
        }
    }
}

const createReport = async (req) => {
    try {
        const reportUserId = req.body.reportUserId
        const scheduleId = req.body.scheduleId
        const title = req.body.title
        const description = req.body.description

        const loggedInUser = req.user.userId

        //check user
        const user = await db.User.findOne({
            where: {
                userId: reportUserId
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
        if(reportUserId !== loggedInUser){
            return{
                status: StatusCodes.NOT_FOUND,
                data: {
                    msg: `Cannot report using other account`
                }
            }
        }

        let setUpReport
        if(scheduleId.trim() !== ""){
            const schedule = await db.Schedule.findOne({
                where: {
                    scheduleId: scheduleId
                }
            })
    
            if(!schedule){
                return {
                    status: StatusCodes.NOT_FOUND,
                    data: {
                        msg: "Tour schedule not found!"
                    }
                }
            }
            setUpReport = { reportUserId: reportUserId, scheduleId: scheduleId, title: title, description: description, reportStatus: REPORT_STATUS.PENDING }
        } else {
            setUpReport = { reportUserId: reportUserId, title: title, description: description, reportStatus: REPORT_STATUS.PENDING }
        }

        const report = await db.Report.create(setUpReport)

        return{
            status: report ? StatusCodes.CREATED : StatusCodes.BAD_REQUEST,
            data: {
                msg: report ? 'Create report successfully' : 'Failed to report!',
                report: report
            }
        }
    } catch (error) {
        console.error(error)
        return {
            status: StatusCodes.INTERNAL_SERVER_ERROR,
            data:{
                msg: "An error has occurred!",
            }
        }
    }
}

const updateReport = async (req) => {
    const t = await db.sequelize.transaction()
    try {
        const reportId = req.params.id || ""
        const responseUserId = req.body.responseUserId || ""
        const response = req.body.response || ""
        const reportStatus = req.body.reportStatus || ""

        const user = await db.User.findOne({
            where: {
                userId: responseUserId
            }
        })
        if(!user){
            return {
                status: StatusCodes.NOT_FOUND,
                data: {
                    msg: "Response user not found!"
                }
            }
        }
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

        if(report.responseUserId !== null && report.responseUserId !== undefined){
            if(report.responseUserId !== responseUserId){
                return{
                    status: StatusCodes.BAD_REQUEST,
                    data: {
                        msg: `A response from different manager has been recorded for this report!`,
                    }
                }
            }
        }

        if (responseUserId !== "") {
            updateReport.responseUserId = responseUserId
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
        console.error(error)
        return {
            status: StatusCodes.INTERNAL_SERVER_ERROR,
            data:{
                msg: "An error has occurred!",
            }
        }
    }
}

module.exports = { getReports, getReportsById, createReport, updateReport }
