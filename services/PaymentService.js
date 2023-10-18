const crypto = require('crypto');
const db = require('../models');
const STATUS = require("../enums/StatusEnum")
const mailer = require("../utils/MailerUtil")
const qr = require('qrcode');
const createMoMoPaymentRequest = (amounts, redirect, bookingId) =>
    new Promise(async (resolve, reject) => {
        try {
            //https://developers.momo.vn/#/docs/en/aiov2/?id=payment-method
            //parameters
            var partnerCode = "MOMO";
            var accessKey = "F8BBA842ECF85";
            var secretkey = "K951B6PE1waDMi640xX08PD3vg6EkVlz";
            var requestId = partnerCode + new Date().getTime();
            var orderId = requestId;
            var orderInfo = "Pay with MoMo";
            var redirectUrl = redirect;
            var ipnUrl = "https://nbtour-fc9f59891cf4.herokuapp.com/api/v1/payments/momo-ipn";
            // var ipnUrl = redirectUrl = "https://webhook.site/454e7b77-f177-4ece-8236-ddf1c26ba7f8";
            var amount = amounts;
            var requestType = "captureWallet"
            var extraData = bookingId; //pass empty value if your merchant does not have stores

            const transaction = await db.Transaction.findOne({
                where: { bookingId: bookingId },
            })
            if (!transaction) {
                resolve({
                    status: 404,
                    data: {
                        msg: `Cannot find transaction with Id: ${bookingId}`,
                    }
                });
                return
            } else {
                if (transaction.isSuccess === true) {
                    resolve({
                        status: 400,
                        data: {
                            msg: 'Transaction already paid',
                        }
                    });
                    return
                }
            }
            //before sign HMAC SHA256 with format
            //accessKey=$accessKey&amount=$amount&extraData=$extraData&ipnUrl=$ipnUrl&orderId=$orderId&orderInfo=$orderInfo&partnerCode=$partnerCode&redirectUrl=$redirectUrl&requestId=$requestId&requestType=$requestType
            var rawSignature = "accessKey=" + accessKey + "&amount=" + amount + "&extraData=" + extraData + "&ipnUrl=" + ipnUrl + "&orderId=" + orderId + "&orderInfo=" + orderInfo + "&partnerCode=" + partnerCode + "&redirectUrl=" + redirectUrl + "&requestId=" + requestId + "&requestType=" + requestType
            //puts raw signature
            // console.log("--------------------RAW SIGNATURE----------------")
            // console.log(rawSignature)
            //signature
            var signature = crypto.createHmac('sha256', secretkey)
                .update(rawSignature)
                .digest('hex');
            // console.log("--------------------SIGNATURE----------------")
            // console.log(signature)

            //json object send to MoMo endpoint
            const requestBody = JSON.stringify({
                partnerCode: partnerCode,
                accessKey: accessKey,
                requestId: requestId,
                amount: amount,
                orderId: orderId,
                orderInfo: orderInfo,
                redirectUrl: redirectUrl,
                ipnUrl: ipnUrl,
                extraData: extraData,
                requestType: requestType,
                signature: signature,
                lang: 'vi'
            });
            //Create the HTTPS objects
            const https = require('https');
            const options = {
                hostname: 'test-payment.momo.vn',
                port: 443,
                path: '/v2/gateway/api/create',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(requestBody)
                }
            }

            //Send the request and get the response
            const req = https.request(options, res => {
                console.log(`Status: ${res.statusCode}`);
                console.log(`Headers: ${JSON.stringify(res.headers)}`);
                res.setEncoding('utf8');
                res.on('data', (body) => {
                    console.log('Body: ');
                    console.log(body);
                    console.log('payUrl: ');
                    console.log(JSON.parse(body));
                    resolve({
                        status: 200,
                        data: {
                            msg: "Get link payment successfully!",
                            url: JSON.parse(body).payUrl,
                        }
                    });
                });
                res.on('end', () => {
                    console.log('No more data in response.');
                });
            })

            req.on('error', (e) => {
                console.log(`problem with request: ${e.message}`);
            });

            // write data to request body
            console.log("Sending....")
            req.write(requestBody);
            req.end();
        } catch (error) {
            reject(error);
        }
    });
const refundMomo = async (bookingId) => {
    try {
        const bookingDetail = await db.BookingDetail.findOne({
            raw: true,
            nest: true,
            where: {
                bookingId: bookingId
            },
            include: {
                model: db.Ticket,
                as: "detail_ticket",
                attributes: ["ticketId"],
                include: {
                    model: db.Tour,
                    as: "ticket_tour",
                    attributes: ["tourId", "tourName", "departureDate"],
                }
            }
        })
        if (!bookingDetail) {
            return {
                status: 404,
                data: {
                    msg: `Cannot find booking with Id: ${bookingId}`,
                }
            };
        }

        const transaction = await db.Transaction.findOne({
            raw: true,
            nest: true,
            where: {
                bookingId: bookingId
            },
        })
        if (!transaction) {
            return {
                status: 404,
                data: {
                    msg: `Cannot find transaction with Id: ${bookingId}`,
                }
            };
        } else {
            if (transaction.isSuccess === false) {
                return {
                    status: 400,
                    data: {
                        msg: `Transaction not paid with bookingId: ${bookingId}`,
                    }
                };
            }
            let amount = parseInt(transaction.amount)
            var partnerCode = "MOMO";
            var accessKey = "F8BBA842ECF85";
            var secretkey = "K951B6PE1waDMi640xX08PD3vg6EkVlz";
            var requestId = partnerCode + new Date().getTime();
            var orderId = requestId;
            var orderInfo = "Refund calceled booking with MoMo";

            const departureDate = new Date(bookingDetail.detail_ticket.ticket_tour.departureDate)
            const currentDate = new Date()
            currentDate.setHours(currentDate.getHours() + 7)
            const timeDifference = departureDate - currentDate
            const twoDaysInMillis = 2 * 24 * 60 * 60 * 1000 // 2 days in milliseconds
            const oneDayInMillis = 24 * 60 * 60 * 1000 // 1 day in milliseconds
            if (timeDifference <= twoDaysInMillis) {
                amount = amount * 90 / 100
            } else if (timeDifference <= oneDayInMillis) {
                amount = amount * 75 / 100
            }
            var rawSignature =
                "accessKey=" + accessKey +
                "&amount=" + amount +
                "&orderId=" + orderId +
                "&orderInfo=" + orderInfo +
                "&partnerCode=" + partnerCode +
                "&requestId=" + requestId +
                "&transId=" + transaction.transactionCode

            var signature = crypto.createHmac('sha256', secretkey)
                .update(rawSignature)
                .digest('hex');

            const requestBody = JSON.stringify({
                partnerCode: partnerCode,
                accessKey: accessKey,
                requestId: requestId,
                amount: amount,
                orderId: orderId,
                orderInfo: orderInfo,
                transId: transaction.transactionCode,
                signature: signature,
                lang: 'vi'
            });

            const https = require('https');
            const options = {
                hostname: 'test-payment.momo.vn',
                port: 443,
                path: '/v2/gateway/api/refund',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(requestBody)
                }
            }

            const req = https.request(options, res => {
                res.setEncoding('utf8');
                res.on('data', (body) => {
                    console.log(JSON.parse(body));
                    return{
                        status: 200,
                        data: {
                            msg: "Refund successfully",
                        }
                    };
                });
                res.on('end', () => {
                    console.log('No more data in response.');
                });
            })

            req.on('error', (e) => {
                console.log(`problem with request: ${e.message}`);
            });

            req.write(requestBody);
            req.end();
        }
    } catch (error) {
        console.log(error)
    }
}

const getMoMoPaymentResponse = (req) =>
    new Promise(async (resolve, reject) => {
        try {
            const ipnData = req.body;
            const bookingId = ipnData.extraData
            if (ipnData.resultCode === 0) {
                console.log(ipnData);
                const bookingDetail = await db.BookingDetail.findOne({
                    where: {
                        bookingId: bookingId
                    },
                    include: [
                        {
                            model: db.Ticket,
                            as: "booking_detail_ticket",
                            include:
                            {
                                model: db.Tour,
                                as: "ticket_tour",
                                attributes: ["tourName", "departureDate", "duration", "status"],
                                include:
                                {
                                    model: db.Bus,
                                    as: "tour_bus",
                                    attributes: ["busPlate"],
                                }
                            },
                            attributes: {
                                exclude: ["tourid", "ticketTypeId", "updatedAt", "createdAt"]
                            }
                        }, {
                            model: db.Booking,
                            as: "detail_booking",
                            include: [
                                {
                                    model: db.User,
                                    as: "booking_user",
                                    attributes: ["userName", "email"]
                                },
                                {
                                    model: db.Station,
                                    as: "booking_departure_station",
                                    attributes: ["stationName"]
                                },
                            ],
                            attributes: ["bookingId", "bookingCode", "customerId", "departureStationId", "totalPrice"]
                        }
                    ]
                })

                const tourName = bookingDetail.booking_detail_ticket.ticket_tour.tourName
                const tourDepartureDate = new Date(bookingDetail.booking_detail_ticket.ticket_tour.departureDate)
                const formatDepartureDate = `${tourDepartureDate.getDate().toString().padStart(2, '0')}/${(tourDepartureDate.getMonth() + 1).toString().padStart(2, '0')}/${tourDepartureDate.getFullYear()}  |  ${tourDepartureDate.getHours().toString().padStart(2, '0')}:${tourDepartureDate.getMinutes().toString().padStart(2, '0')}`
                const tourDuration = bookingDetail.booking_detail_ticket.ticket_tour.duration
                const totalPrice = bookingDetail.detail_booking.totalPrice
                const stationName = bookingDetail.detail_booking.booking_departure_station.stationName
                const busPlate = bookingDetail.booking_detail_ticket.ticket_tour.tour_bus.busPlate
                const bookingCode = bookingDetail.detail_booking.bookingCode

                const bookedTickets = JSON.parse(bookingId)

                qr.toFile(`./qrcode/${bookingId}.png`, bookedTickets, function (err) {
                    if (err) { console.log(err) }
                })

                const htmlContent = {
                    body: {
                        name: bookingDetail.detail_booking.booking_user.userName,
                        intro: [
                            `Thank you for choosing <b>NBTour</b> booking system. Here is your <b>QR code<b> attachment for upcomming tour tickets`,
                            `<b>Tour Information:</b>`,
                            `  - Tour Name: <b>${tourName}</b>`,
                            `  - Tour Departure Date: <b>${formatDepartureDate}</b>`,
                            `  - Departure Station: <b>${stationName}</b>`,
                            `  - Booking Code: <b>${bookingCode}</b>`,
                            `  - Bus plate: <b>${busPlate}</b>`,
                            `  - Tour Duration: <b>${tourDuration}</b>`,
                            `  - Tour Total Price: <b>${totalPrice}</b>`
                        ],
                        outro: [
                            `If you have any questions or need assistance, please to reach out to our customer support team at nbtour@gmail.com.`
                        ],
                        signature: 'Sincerely'
                    }
                };
                mailer.sendMail(bookingDetail.detail_booking.booking_user.email, "Tour booking tickets", htmlContent, bookingId)

                const productOrder = await db.ProductOrder.findOne({
                    where: {
                        bookingId: bookingDetail.detail_booking.bookingId
                    }
                })

                if (productOrder) {
                    await db.ProductOrder.update({
                        status: STATUS.ACTIVE
                    }, {
                        where: {
                            bookingId: bookingId
                        }
                    })
                }

                await db.Booking.update({
                    status: STATUS.ACTIVE
                }, {
                    where: {
                        bookingId: bookingId
                    }
                })
                await db.BookingDetail.update({
                    status: STATUS.ACTIVE
                }, {
                    where: {
                        bookingId: bookingId
                    }
                })
                await db.Transaction.update({
                    isSuccess: true
                }, {
                    where: {
                        bookingId: bookingId
                    }
                })

                resolve({
                    status: 200,
                    data: {
                        msg: 'Payment processed successfully'
                    }
                });
            } else {
                // Payment fail
                resolve({
                    status: 400,
                    data: {
                        msg: 'Payment process failed',
                        bookingId: bookingId
                    }
                });
            }
        } catch (error) {
            console.error(error);
            resolve({
                status: 500,
                data: {
                    msg: 'Error processing payment',
                }
            });
        }
    });

module.exports = { createMoMoPaymentRequest, refundMomo, getMoMoPaymentResponse };
