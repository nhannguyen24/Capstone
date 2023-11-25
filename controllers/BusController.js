const services = require('../services/BusService')
const { BadRequestError, InternalServerError } = require('../errors/Index')
const { StatusCodes } = require('http-status-codes')

const getBuses = async (req, res) => {
    try {
        const errors = {}
        const page = req.query.page || ""
        const limit = req.query.limit || ""
        if (page !== "") {
            if (isNaN(page)) {
                errors.page = "Page needs to be a number"
            } else {
                if (parseInt(page) < 1) {
                    errors.page = "Page needs to be 1 or higher"
                }
            }
        } else {
            errors.page = "Page required!"
        }

        if (limit !== "") {
            if (isNaN(limit)) {
                errors.limit = "Limit needs to be a number"
            } else {
                if (parseInt(limit) < 1) {
                    errors.limit = "Limit needs to be 1 or higher"
                }
            }
        }else {
            errors.limit = "Limit required!"
        }

        if (Object.keys(errors).length === 0) {
            const response = await services.getBuses(req)
            return res.status(response.status).json(response.data)
        } else {
            return res.status(StatusCodes.BAD_REQUEST).json(errors)
        }
    } catch (error) {
        throw new InternalServerError(error)
    }
}
const getBusById = async (req, res) => {
    try {
        const busId = req.params.id || ""
        const errors = {}

        if(busId.trim() === ""){
            errors.busId = "Id required!"
        }
        if (Object.keys(errors).length === 0) {
            const response = await services.getBusById(busId)
            return res.status(response.status).json(response.data)
        } else {
            return res.status(StatusCodes.BAD_REQUEST).json(errors)
        }
    } catch (error) {
        throw new InternalServerError(error)
    }
}

const createBus = async (req, res) => {
    try {
        const errors = {}
        const busPlate = req.query.busPlate || ""
        const numberSeat = req.query.numberSeat || ""
        const isDoubleDecker = req.query.isDoubleDecker || ""
        if(busPlate.trim() === ""){
            errors.busPlate = "busPlate required!"
        }
        if(isDoubleDecker.trim() === ""){
            errors.isDoubleDecker = "isDoubleDecker required!"
        } else {
            if(isDoubleDecker !== true || isDoubleDecker !== false){
                errors.isDoubleDecker = "isDoubleDecker needs to be true or false!"
            }
        }
        if(numberSeat.trim() === ""){
            errors.numberSeat = "numberSeat required!"
        } else {
            if (isNaN(numberSeat)) {
                errors.numberSeat = "numberSeat needs to be a number!"
            } else {
                if (parseInt(numberSeat) < 10) {
                    errors.numberSeat = "numberSeat needs to be at least 10!"
                }
            }
        }
        if (Object.keys(errors).length === 0) {
            const response = await services.createBus(req)
            return res.status(response.status).json(response.data)
        } else {
            return res.status(StatusCodes.BAD_REQUEST).json(errors)
        }
    } catch (error) {
        throw new InternalServerError(error)
    }
}

const updateBus = async (req, res) => {
    try {
        const busId = req.params.id || ""
        const busPlate = req.body.busPlate || ""
        const numberSeat = req.body.numberSeat || ""
        const isDoubleDecker = req.body.isDoubleDecker || ""
        const status = req.body.status || ""
        const errors = {}
        if (busId.trim() === "") {
            errors.busId = "Id required!"
        }
        if (busPlate.trim() === "" && numberSeat.trim() === "" && isDoubleDecker.trim() === "" && status.trim() === "") {
            errors.fields = "Update field required!"
        } else {
            if (numberSeat.trim() !== "") {
                if (isNaN(numberSeat)) {
                    errors.numberSeat = "numberSeat needs to be a number!"
                } else {
                    if (parseInt(numberSeat) < 10) {
                        errors.numberSeat = "numberSeat needs to be at least 10"
                    }
                }
            }
            if(isDoubleDecker.trim() === ""){
                errors.isDoubleDecker = "isDoubleDecker required!"
            } else {
                if(isDoubleDecker !== true || isDoubleDecker !== false){
                    errors.isDoubleDecker = "isDoubleDecker needs to be true or false!"
                }
            }
        }
        if (Object.keys(errors).length === 0) {
            const response = await services.updateBus(req)
            return res.status(response.status).json(response.data)
        } else {
            return res.status(StatusCodes.BAD_REQUEST).json(errors)
        }
    } catch (error) {
        throw new InternalServerError(error)
    }
}
const deleteBus = async (req, res) => {
    try {
        const busId = req.params.id || ""
        const errors = {}
        if(busId.trim() === ""){
            errors.busId === "Id required!"
        }
        if (Object.keys(errors).length === 0) {
            const response = await services.deleteBus(busId)
            return res.status(response.status).json(response.data)
        } else {
            return res.status(StatusCodes.BAD_REQUEST).json(errors)
        }
    } catch (error) {
        throw new InternalServerError(error)
    }
}

module.exports = { getBuses, getBusById, createBus, updateBus, deleteBus }
