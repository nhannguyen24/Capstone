const services = require('../services/BusService');
const { BadRequestError, InternalServerError } = require('../errors/Index');

const getBuses = async (req, res) => {
    try {
        const errors = []
        const page = req.query.page || ""
        const limit = req.query.limit || ""
        if (page !== "") {
            if (isNaN(page)) {
                errors.push("Page needs to be a number");
            } else {
                if (parseInt(page) < 1) {
                    errors.push("Page needs to be 1 or higher");
                }
            }
        } else {
            errors.push("Page required!")
        }

        if (limit !== "") {
            if (isNaN(limit)) {
                errors.push("Limit needs to be a number");
            } else {
                if (parseInt(limit) < 1) {
                    errors.push("Limit needs to be 1 or higher");
                }
            }
        }else {
            errors.push("Limit required!")
        }

        if (errors.length === 0) {
            const response = await services.getBuses(req);
            return res.status(response.status).json(response.data);
        } else {
            return res.status(400).json(errors);
        }
    } catch (error) {
        throw new InternalServerError(error);
    }
};
const getBusById = async (req, res) => {
    try {
        const response = await services.getBusById(req);
        return res.status(response.status).json(response.data);
    } catch (error) {
        throw new InternalServerError(error);
    }
};

const createBus = async (req, res) => {
    try {
        const errors = []
        const busPlate = req.query.busPlate || ""
        const numberSeat = req.query.numberSeat || ""
        const isDoubleDecker = req.query.isDoubleDecker || ""
        if(busPlate.trim() === ""){
            errors.push("busPlate required!")
        }
        if(isDoubleDecker === ""){
            errors.push("isDoubleDecker required!")
        } else {
            if(isDoubleDecker !== true || isDoubleDecker !== false){
                errors.push("isDoubleDecker needs to be true or false!")
            }
        }
        if(numberSeat === ""){
            errors.push("numberSeat required!")
        } else {
            if (isNaN(numberSeat)) {
                errors.push("numberSeat needs to be a number")
            } else {
                if (parseInt(numberSeat) < 10) {
                    errors.push("numberSeat needs to be at least 10")
                }
            }
        }
        const response = await services.createBus(req);
        return res.status(response.status).json(response.data);
    } catch (error) {
        throw new InternalServerError(error);
    }
}

const updateBus = async (req, res) => {
    try {
        const busId = req.params.id || ""
        const busPlate = req.body.busPlate || ""
        const numberSeat = req.body.numberSeat || ""
        const isDoubleDecker = req.body.isDoubleDecker || ""
        const status = req.body.status || ""
        const errors = []
        if (busId.trim() === "") {
            errors.push("Id required!")
        }
        if (busPlate.trim() === "" && numberSeat === "" && isDoubleDecker === "" && status.trim() === "") {
            errors.push("Update field required!")
        } else {
            if (numberSeat !== "") {
                if (isNaN(numberSeat)) {
                    errors.push("numberSeat needs to be a number")
                } else {
                    if (parseInt(numberSeat) < 10) {
                        errors.push("numberSeat needs to be at least 10")
                    }
                }
            }
            if(isDoubleDecker !== true || isDoubleDecker !== false){
                errors.push("isDoubleDecker needs to be true or false!")
            }
        }
        if (errors.length === 0) {
            const response = await services.updateBus(req);
            return res.status(response.status).json(response.data);
        } else {
            return res.status(400).json(errors);
        }
    } catch (error) {
        throw new InternalServerError(error);
    }
}
const deleteBus = async (req, res) => {
    try {
        const response = await services.deleteBus(req);
        return res.status(response.status).json(response.data);
    } catch (error) {
        throw new InternalServerError(error);
    }
}

module.exports = { getBuses, getBusById, createBus, updateBus, deleteBus }