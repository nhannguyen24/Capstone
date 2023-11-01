const services = require('../services/BookingService');
const { BadRequestError, InternalServerError } = require('../errors/Index');

const getBookingDetailByBookingId = async (req, res) => {
    try {
        const response = await services.getBookingDetailByBookingId(req);
        return res.status(response.status).json(response.data);
    } catch (error) {
        throw new InternalServerError(error);
    }
};

const getBookings = async (req, res) => {
    try {
        const errors = []
        const page = parseInt(req.query.page)
        const limit = parseInt(req.query.limit)
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
        } else {
            errors.push("Limit required!")
        }

        if (errors.length === 0) {
            const response = await services.getBookings(req);
            return res.status(response.status).json(response.data);
        } else {
            return res.status(400).json(errors);
        }
    } catch (error) {
        throw new InternalServerError(error);
    }
};

const getBookingsByEmail = async (req, res) => {
    try {
        const email = req.query.email || ""
        const page = parseInt(req.query.page) || ""
        const limit = parseInt(req.query.limit) || ""
        const errors = []
        const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
        if (email.trim() === "") {
            errors.push("Email required!")
        } else if (!emailRegex.test(email)) {
            errors.push("Invalid email address!")
        }

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
        } else {
            errors.push("Limit required!")
        }

        if (errors.length === 0) {
            const response = await services.getBookingsByEmail(req);
            return res.status(response.status).json(response.data);
        } else {
            return res.status(400).json(errors);
        }
    } catch (error) {
        throw new InternalServerError(error);
    }
};
const createBookingWeb = async (req, res) => {
    try {
        const errors = []
        const totalPrice = req.body.totalPrice || ""
        const departureStationId = req.body.departureStationId || ""
        if(totalPrice === ""){
            errors.push("totalPrice required!")
        } else {
            if(isNaN(totalPrice)){
                errors.push("totalPrice needs to be a number")
            } else {
                if(parseInt(totalPrice) < 1000){
                    errors.push("totalPrice needs to be atleast 1000")
                }
            }
        }
        if(departureStationId.trim() === ""){
            errors.push("departureStationId required!")
        }

        if (errors.length === 0) {
            const response = await services.createBookingWeb(req);
            return res.status(response.status).json(response.data);
        } else {
            return res.status(400).json(errors);
        }
    } catch (error) {
        throw new InternalServerError(error);
    }
};
const createBookingOffline = async (req, res) => {
    try {
        const errors = []
        const totalPrice = req.body.totalPrice || ""
        const departureStationId = req.body.departureStationId || ""
        if(totalPrice === ""){
            errors.push("totalPrice required!")
        } else {
            if(isNaN(totalPrice)){
                errors.push("totalPrice needs to be a number")
            } else {
                if(parseInt(totalPrice) < 1000){
                    errors.push("totalPrice needs to be atleast 1000")
                }
            }
        }
        if(departureStationId.trim() === ""){
            errors.push("departureStationId required!")
        }

        if (errors.length === 0) {
            const response = await services.createBookingOffline(req);
            return res.status(response.status).json(response.data);
        } else {
            return res.status(400).json(errors);
        }
    } catch (error) {
        throw new InternalServerError(error);
    }
};

const checkInQrCode = async (req, res) => {
    try {
        const bookingId = req.params.id || ""

        const errors = []

        if (bookingId.trim() === "") {
            errors.push("Id required!")
        }

        if (errors.length === 0) {
            const response = await services.checkInQrCode(bookingId);
            return res.status(response.status).json(response.data);
        } else {
            return res.status(400).json(errors);
        }
    } catch (error) {
        throw new InternalServerError(error);
    }
}
const cancelBooking = async (req, res) => {
    try {
        const bookingId = req.params.id || ""
        const errors = []

        if (bookingId.trim() === "") {
            errors.push("Id required!")
        }

        if (errors.length === 0) {
            const response = await services.cancelBooking(bookingId);
            return res.status(response.status).json(response.data);
        } else {
            return res.status(400).json(errors);
        }
    } catch (error) {
        throw new InternalServerError(error);
    }
}

module.exports = { getBookingDetailByBookingId, getBookings, getBookingsByEmail, createBookingWeb, createBookingOffline, checkInQrCode, cancelBooking }