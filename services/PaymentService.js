const crypto = require('crypto');

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
                    // console.log('Body: ');
                    // console.log(body);
                    // console.log('payUrl: ');
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

const getMoMoPaymentResponse = (req) =>
    new Promise(async (resolve, reject) => {
        try {
            const ipnData = req.body;
console.log("1")
            if (ipnData.resultCode === 0) {
                console.log("2")
                // Signature is valid
                // Process the payment status and update your database
                // Send a response with status 200 to acknowledge receipt
                const bookingId = ipnData.extraData

                const booking = await db.Booking.findOne({
                    where: {
                        bookingId: bookingId
                    },
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
                    ]
                })
                console.log(booking)
                resolve({
                    status: 200,
                    data: {
                        msg: 'Payment processed unsuccessfully',
                        data: booking
                    }
                });
                return




                const tourName = tour.tourName
                const tourDepartureDate = new Date(tour.departureDate)
                const formatDepartureDate = `${tourDepartureDate.getDate().toString().padStart(2, '0')}/${(tourDepartureDate.getMonth() + 1).toString().padStart(2, '0')}/${tourDepartureDate.getFullYear()}  |  ${tourDepartureDate.getHours().toString().padStart(2, '0')}:${tourDepartureDate.getMinutes().toString().padStart(2, '0')}`
                const tourDuration = tour.duration
                const getBookedTickets = await db.BookingDetail.findAll({
                    where: {
                        bookingId: booking.bookingId
                    },
                    include:
                    {
                        model: db.Ticket,
                        as: "booking_detail_ticket",
                        include: [
                            {
                                model: db.TicketType,
                                as: "ticket_type",
                                attributes: ["ticketTypeName", "description"]
                            },
                            {
                                model: db.Tour,
                                as: "ticket_tour",
                                attributes: ["tourName", "departureDate", "duration", "status"]
                            },
                        ],
                        attributes: {
                            exclude: ["tourid", "ticketTypeId", "updatedAt", "createdAt"]
                        }
                    },
                    attributes: {
                        exclude: ["ticketId", "updatedAt", "createdAt"]
                    }
                })

                const bookedTickets = JSON.stringify(getBookedTickets)

                qr.toFile(`./qrcode/${booking.bookingId}.png`, bookedTickets, function (err) {
                    if (err) { console.log(err) }
                })

                const htmlContent = {
                    body: {
                        name: resultUser[0].dataValues.userName,
                        intro: [`Thank you for choosing <b>NBTour</b> booking system. Here is your <b>QR code<b> attachment for upcomming tour tickets`,
                            `<b>Tour Information:</b>`, `  - Tour Name: <b>${tourName}</b>`, `  - Tour Departure Date: <b>${formatDepartureDate}</b>`, `  - Departure Station: <b>${station.stationName}</b>`,
                            `  - Tour Duration: <b>${tourDuration}</b>`, `  - Tour Total Price: <b>${totalPrice}</b>`],
                        outro: [`If you have any questions or need assistance, please to reach out to our customer support team at [nbtour@gmail.com].`],
                        signature: 'Sincerely'
                    }
                };
                mailer.sendMail(resultUser[0].dataValues.email, "Tour booking tickets", htmlContent, booking.bookingId)






                console.log('cccc', ipnData);
                // console.log(ipnData);
                resolve({
                    status: 200,
                    data: {
                        msg: 'Payment processed successfully'
                    }
                });
            } else {
                // Invalid signature, do not trust the IPN
                resolve({
                    status: 400,
                    data: {
                        msg: 'Payment processed unsuccessfully'
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

module.exports = { createMoMoPaymentRequest, getMoMoPaymentResponse };



// partnerCode%3DMOMO%26
// orderId%3DMOMO1696253817889%26
// requestId%3DMOMO1696253817889%26
// amount%3D10000%26
// orderInfo%3DPay%2Bwith%2BMoMo%26
// orderType%3Dmomo_wallet%26
// transId%3D1696253830305%26
// resultCode%3D1006%26
// message%3DTransaction%2Bdenied%2Bby%2Buser.%26
// payType%3D%26
// responseTime%3D1696253830348%26
// extraData%3D%26
// signature%3D6259114550a9d17d8286c05102b7a1b90cdf7c693dbbdb863e1840a7c88b2d23
