const crypto = require("crypto")
const db = require("../models")
const STATUS = require("../enums/StatusEnum")
const mailer = require("../utils/MailerUtil")
const qr = require("qrcode")
const BOOKING_STATUS = require("../enums/BookingStatusEnum")
const TRANSACTION_TYPE = require("../enums/TransactionTypeEnum")
const { StatusCodes } = require("http-status-codes")
require('dotenv').config();
const PayOS = require("@payos/node");

const createMoMoPaymentRequest = (amount, redirect, bookingId) =>
  new Promise(async (resolve, reject) => {
    try {
      var partnerCode = "MOMO"
      var accessKey = process.env.MOMO_ACCESS_KEY
      var secretkey = process.env.MOMO_SECRET_KEY
      var requestId = partnerCode + new Date().getTime()
      var orderId = requestId
      var orderInfo = "Pay with MoMo"
      var redirectUrl = redirect
      var ipnUrl =
        "https://nbtour-fc9f59891cf4.herokuapp.com/api/v1/payments/momo-ipn"
      var requestType = "captureWallet"
      var extraData = bookingId //pass empty value if your merchant does not have stores

      const transaction = await db.Transaction.findOne({
        where: { bookingId: bookingId },
        include: {
          model: db.Booking,
          as: "transaction_booking",
          attributes: ["endPaymentTime"],
        },
      })
      if (!transaction) {
        resolve({
          status: StatusCodes.NOT_FOUND,
          data: {
            msg: `Booking transaction not found!`,
          },
        })
        return
      } else {
        if (STATUS.PAID === transaction.status) {
          resolve({
            status: StatusCodes.BAD_REQUEST,
            data: {
              msg: "Booking transaction already paid!",
            },
          })
        }
        const currentDate = new Date()
        currentDate.setHours(currentDate.getHours() + 7)
        const endBookingTime = new Date(
          transaction.transaction_booking.endPaymentTime
        )
        if (endBookingTime <= currentDate) {
          resolve({
            status: StatusCodes.BAD_REQUEST,
            data: {
              msg: "Booking transaction expired!",
            },
          })
        }
      }
      var rawSignature =
        "accessKey=" +
        accessKey +
        "&amount=" +
        amount +
        "&extraData=" +
        extraData +
        "&ipnUrl=" +
        ipnUrl +
        "&orderId=" +
        orderId +
        "&orderInfo=" +
        orderInfo +
        "&partnerCode=" +
        partnerCode +
        "&redirectUrl=" +
        redirectUrl +
        "&requestId=" +
        requestId +
        "&requestType=" +
        requestType
      var signature = crypto
        .createHmac("sha256", secretkey)
        .update(rawSignature)
        .digest("hex")
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
        lang: "vi",
      })

      //Create the HTTPS objects
      const https = require("https")
      const options = {
        hostname: "test-payment.momo.vn",
        port: 443,
        path: "/v2/gateway/api/create",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(requestBody),
        },
      }

      //Send the request and get the response
      const req = https.request(options, (res) => {
        res.setEncoding("utf8")
        res.on("data", (body) => {
          console.log("request", requestBody)
          console.log("Body: ")
          console.log(JSON.parse(body))
          resolve({
            status: StatusCodes.OK,
            data: {
              msg: "Get link payment successfully!",
              url: JSON.parse(body).payUrl,
            },
          })
        })
      })

      req.on("error", (e) => {
        console.log(`problem with request: ${e.message}`)
      })

      // write data to request body
      req.write(requestBody)
      req.end()
    } catch (error) {
      reject(error)
    }
  })

const createPayOsPaymentRequest = async (amount, bookingId, cancelUrl) => {
  try {
    const booking = await db.Booking.findOne({
      where: { bookingId: bookingId }
    })

    if (!booking) {
      return {
        status: StatusCodes.NOT_FOUND,
        data: {
          msg: `Booking not found!`,
        },
      }
    }
    const transaction = await db.Transaction.findOne({
      where: { bookingId: booking.bookingId },
      include: {
        model: db.Booking,
        as: "transaction_booking",
        attributes: ["endPaymentTime"],
      },
    })
    if (!transaction) {
      return {
        status: StatusCodes.NOT_FOUND,
        data: {
          msg: `Booking transaction not found!`,
        },
      }
    }
    if (STATUS.PAID === transaction.status) {
      return {
        status: StatusCodes.BAD_REQUEST,
        data: {
          msg: "Booking transaction already paid!",
        },
      }
    }
    const currentDate = new Date()
    currentDate.setHours(currentDate.getHours() + 7)
    const endBookingTime = new Date(
      transaction.transaction_booking.endPaymentTime
    )
    if (endBookingTime <= currentDate) {
      return {
        status: StatusCodes.BAD_REQUEST,
        data: {
          msg: "Booking transaction expired!",
        },
      }
    }

    const payOS = new PayOS(process.env.PAYOS_CLIENT_ID, process.env.PAYOS_API_KEY, process.env.PAYOS_CHECKSUM_KEY);
    const amountNumber = Number(amount);

    const body = {
      orderCode: Number(String(new Date().getTime()).slice(-6)),
      amount: amountNumber,
      description: "Pay booking",
      cancelUrl: cancelUrl,
      returnUrl: "https://nbtour-fc9f59891cf4.herokuapp.com/api/v1/payments/pay-os"
    };

    const paymentLinkRes = await payOS.createPaymentLink(body)
    console.log(paymentLinkRes)
    if (paymentLinkRes) {
      if ("00" === paymentLinkRes.code)
        await db.Transaction.update({
          transactionCode: paymentLinkRes.data.orderCode
        }, {
          where: {
            bookingId: booking.bookingId
          }, individualHooks: true,
        })
    }
    return {
      status: paymentLinkRes ? StatusCodes.OK : StatusCodes.BAD_REQUEST,
      data: paymentLinkRes ? {
        msg: `Creating payment url successfully!`,
        payment: paymentLinkRes
        // bin: paymentLinkRes.bin,
        // checkoutUrl: paymentLinkRes.checkoutUrl,
        // accountNumber: paymentLinkRes.accountNumber,
        // accountName: paymentLinkRes.accountName,
        // amount: paymentLinkRes.amount,
        // description: paymentLinkRes.description,
        // orderCode: paymentLinkRes.orderCode,
        // qrCode: paymentLinkRes.qrCode,
      } : {
        msg: "Failed to get payment url pay-os",
        payment: {}
      }
    }

  } catch (error) {
    console.error(error);
    return {
      status: StatusCodes.INTERNAL_SERVER_ERROR,
      data: {
        msg: "Something went wrong while trying to get pay-os payment request!"
      }
    }
  }
}

const refundMomo = async (bookingId, amount) => {
  return new Promise(async (resolve) => {
    try {
      const booking = await db.Booking.findOne({
        where: {
          bookingId: bookingId
        },
        include: [
          {
            model: db.Transaction,
            as: "booking_transaction"
          }
        ]
      })
      if (!booking) {
        return {
          status: StatusCodes.NOT_FOUND,
          data: {
            msg: `Booking not found!`,
          },
        }
      }

      if (STATUS.DRAFT === booking.bookingStatus) {
        return {
          status: StatusCodes.BAD_REQUEST,
          data: {
            msg: `Booking not paid!`,
          },
        }
      } else if (STATUS.REFUNDED === booking.booking_transaction.status) {
        return {
          status: StatusCodes.BAD_REQUEST,
          data: {
            msg: `Booking already refunded!`,
          },
        }
      }
      let _amount = parseInt(amount)
      var partnerCode = "MOMO"
      var accessKey = process.env.MOMO_ACCESS_KEY
      var secretkey = process.env.MOMO_SECRET_KEY
      var requestId = partnerCode + new Date().getTime()
      var orderId = requestId
      var description = "Refund canceled booking"
      var transId = booking.booking_transaction.transactionCode

      var rawSignature =
        "accessKey=" +
        accessKey +
        "&amount=" +
        _amount +
        "&description=" +
        description +
        "&orderId=" +
        orderId +
        "&partnerCode=" +
        partnerCode +
        "&requestId=" +
        requestId +
        "&transId=" +
        transId

      var signature = crypto
        .createHmac("sha256", secretkey)
        .update(rawSignature)
        .digest("hex")

      const requestBody = JSON.stringify({
        partnerCode: partnerCode,
        accessKey: accessKey,
        requestId: requestId,
        amount: _amount,
        orderId: orderId,
        description: description,
        transId: transId,
        signature: signature,
        lang: "vi",
      })

      const https = require("https")
      const options = {
        hostname: "test-payment.momo.vn",
        port: 443,
        path: "/v2/gateway/api/refund",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(requestBody),
        },
      }

      const req = https.request(options, (res) => {
        res.setEncoding("utf8")
        let responseBody = ""

        res.on("data", (chunk) => {
          responseBody += chunk
          const response = JSON.parse(responseBody)
          if (response.resultCode === 0) {
            resolve({
              status: StatusCodes.OK,
              data: {
                msg: `Refund to booking ${booking.bookingCode}`,
                refundAmount: _amount,
              },
            })
          } else {
            resolve({
              status: StatusCodes.BAD_REQUEST,
              data: {
                msg: `${response.message} (Booking: ${booking.bookingCode})`,
                refundAmount: _amount,
              },
            })
          }
        })

        res.on("end", () => {
          console.log("No more data in response.")
        })
      })

      req.on("error", (e) => {
        console.log(`Problem with request: ${e.message}`)
        resolve({
          status: StatusCodes.INTERNAL_SERVER_ERROR,
          data: {
            msg: "Internal server error",
          },
        })
      })

      req.write(requestBody)
      req.end()


    } catch (error) {
      console.log("Error:", error)
    }
  })
}

const getPayOsPaymentResponse = async (req) => {
  try {
    const code = req.query.code || ""
    const status = req.query.status || ""
    const orderCode = req.query.orderCode || ""

    if (code !== "" && status !== "" && orderCode !== "") {
      const booking = await db.Booking.findOne({
        include: {
          model: db.Transaction,
          as: "booking_transaction",
          where: {
            transactionCode: orderCode
          }
        }
      })

      if (!booking) {
        console.error("Booking not found with orderCode: ", orderCode)
      } else {
        if ("00" == code && "PAID" === status) {
          const booking = await db.Booking.findOne({
            raw: true,
            nest: true,
            where: {
              bookingId: booking.bookingId,
            },
            attributes: [
              "bookingId", "bookingCode", "totalPrice"
            ],
            include: [
              {
                model: db.User,
                as: "booking_user",
                attributes: ["userName", "email"],
              },
              {
                model: db.Station,
                as: "booking_departure_station",
                attributes: ["stationName", "address"],
              },
              {
                model: db.Schedule,
                as: "booking_schedule",
                include: [
                  {
                    model: db.Bus,
                    as: "schedule_bus",
                    attributes: ["busPlate"],
                  }, {
                    model: db.Tour,
                    as: "schedule_tour",
                    attributes: ["tourName", "duration"],
                  }
                ]
              }
            ]
          })

          const routeSegments = await db.RouteSegment.findAll({
            raw: true,
            nest: true,
            where: {
              tourId: booking.booking_schedule.tourId,
            },
          })

          const tourName = booking.booking_schedule.schedule_tour.tourName
          const bookedStationId = booking.booking_departure_station.stationId
          const tourDepartureTime = new Date(booking.booking_schedule.departureDate).getTime()

          const busArrivalTimeToBookedStation = calculateTotalTime(routeSegments, tourDepartureTime, bookedStationId)

          const formatDepartureDate =
            `${busArrivalTimeToBookedStation.getDate().toString().padStart(2, "0")}/
          ${(busArrivalTimeToBookedStation.getMonth() + 1).toString().padStart(2, "0")}/
          ${busArrivalTimeToBookedStation.getFullYear()}  |  
          ${busArrivalTimeToBookedStation.getHours().toString().padStart(2, "0")}:
          ${busArrivalTimeToBookedStation.getMinutes().toString().padStart(2, "0")}:
          ${busArrivalTimeToBookedStation.getSeconds().toString().padStart(2, "0")}`

          const tourDuration = booking.booking_schedule.schedule_tour.duration
          const totalPrice = booking.totalPrice
          const stationName = booking.booking_departure_station.stationName
          const stationAddress = booking.booking_departure_station.address
          const busPlate = booking.booking_schedule.schedule_bus.busPlate
          const bookingCode = booking.bookingCode

          const customerName = booking.booking_user.userName

          const qrDataURL = await qr.toDataURL(`bookingId: ${booking.bookingId}`)
          const htmlContent = {
            body: {
              name: customerName,
              intro: [
                `Thank you for choosing <b>NBTour</b> booking system. Here is your <b>QR code<b> for upcomming tour tickets`,
                `<b>Tour Information:</b>`,
                `  - Tour Name: <b>${tourName}</b>`,
                `  - Tour Departure Date: <b>${formatDepartureDate}</b>`,
                `  - Departure Station: <b>${stationName}</b>`,
                `  - Station Address: <b>${stationAddress}</b>`,
                `  - Booking Code: <b>${bookingCode}</b>`,
                `  - Bus plate: <b>${busPlate}</b>`,
                `  - Tour Duration: <b>${tourDuration}</b>`,
                `  - Total Price: <b>${totalPrice} VNĐ</b>`,
              ],
              outro: [
                `If you have any questions or need assistance, please to reach out to our customer support team at nbtour@gmail.com.`,
              ],
              signature: "Sincerely",
            },
          }
          mailer.sendMail(
            booking.booking_user.email,
            "Tour booking tickets",
            htmlContent,
            qrDataURL
          )

          db.Booking.update(
            {
              bookingStatus: BOOKING_STATUS.ON_GOING,
            },
            {
              where: {
                bookingId: booking.bookingId,
              },
              individualHooks: true,
            }
          )

          db.BookingDetail.update(
            {
              status: STATUS.ACTIVE,
            },
            {
              where: {
                bookingId: booking.bookingId,
              },
              individualHooks: true,
            }
          )

          db.Transaction.update(
            {
              transactionType: TRANSACTION_TYPE.PAY_OS,
              isPaidToManager: true,
              status: STATUS.PAID,
            },
            {
              where: {
                bookingId: booking.bookingId,
              },
              individualHooks: true,
            }
          )
        }
        console.log("Update payment successfully for ", orderCode)
      }
      console.log("Payment failed for ", orderCode)
    } else {
      console.log("Some payment field empty while getting pay os response")
    }
  } catch (error) {
    console.error("Error while fetching payment response: ", error)
  }
}

const getMoMoPaymentResponse = (req) =>
  new Promise(async (resolve, reject) => {
    try {
      const ipnData = req.body
      const bookingId = ipnData.extraData
      if (ipnData.resultCode === 0) {
        const booking = await db.Booking.findOne({
          raw: true,
          nest: true,
          where: {
            bookingId: bookingId,
          },
          attributes: [
            "bookingId", "bookingCode", "totalPrice"
          ],
          include: [
            {
              model: db.User,
              as: "booking_user",
              attributes: ["userName", "email"],
            },
            {
              model: db.Station,
              as: "booking_departure_station",
              attributes: ["stationName", "address"],
            },
            {
              model: db.Schedule,
              as: "booking_schedule",
              include: [
                {
                  model: db.Bus,
                  as: "schedule_bus",
                  attributes: ["busPlate"],
                }, {
                  model: db.Tour,
                  as: "schedule_tour",
                  attributes: ["tourName", "duration"],
                }
              ]
            }
          ]
        })

        const routeSegments = await db.RouteSegment.findAll({
          raw: true,
          nest: true,
          where: {
            tourId: booking.booking_schedule.tourId,
          },
        })

        const tourName = booking.booking_schedule.schedule_tour.tourName
        const bookedStationId = booking.booking_departure_station.stationId
        const tourDepartureTime = new Date(booking.booking_schedule.departureDate).getTime()

        const busArrivalTimeToBookedStation = calculateTotalTime(routeSegments, tourDepartureTime, bookedStationId)

        const formatDepartureDate =
          `${busArrivalTimeToBookedStation.getDate().toString().padStart(2, "0")}/
        ${(busArrivalTimeToBookedStation.getMonth() + 1).toString().padStart(2, "0")}/
        ${busArrivalTimeToBookedStation.getFullYear()}  |  
        ${busArrivalTimeToBookedStation.getHours().toString().padStart(2, "0")}:
        ${busArrivalTimeToBookedStation.getMinutes().toString().padStart(2, "0")}:
        ${busArrivalTimeToBookedStation.getSeconds().toString().padStart(2, "0")}`

        const tourDuration = booking.booking_schedule.schedule_tour.duration
        const totalPrice = booking.totalPrice
        const stationName = booking.booking_departure_station.stationName
        const stationAddress = booking.booking_departure_station.address
        const busPlate = booking.booking_schedule.schedule_bus.busPlate
        const bookingCode = booking.bookingCode

        const customerName = booking.booking_user.userName

        const qrDataURL = await qr.toDataURL(`bookingId: ${booking.bookingId}`)
        const htmlContent = {
          body: {
            name: customerName,
            intro: [
              `Thank you for choosing <b>NBTour</b> booking system. Here is your <b>QR code<b> for upcomming tour tickets`,
              `<b>Tour Information:</b>`,
              `  - Tour Name: <b>${tourName}</b>`,
              `  - Tour Departure Date: <b>${formatDepartureDate}</b>`,
              `  - Departure Station: <b>${stationName}</b>`,
              `  - Station Address: <b>${stationAddress}</b>`,
              `  - Booking Code: <b>${bookingCode}</b>`,
              `  - Bus plate: <b>${busPlate}</b>`,
              `  - Tour Duration: <b>${tourDuration}</b>`,
              `  - Total Price: <b>${totalPrice} VNĐ</b>`,
            ],
            outro: [
              `If you have any questions or need assistance, please to reach out to our customer support team at nbtour@gmail.com.`,
            ],
            signature: "Sincerely",
          },
        }
        mailer.sendMail(
          booking.booking_user.email,
          "Tour booking tickets",
          htmlContent,
          qrDataURL
        )
        //Find if there are any product of a booking

        db.Booking.update(
          {
            bookingStatus: BOOKING_STATUS.ON_GOING,
          },
          {
            where: {
              bookingId: bookingId,
            },
            individualHooks: true,
          }
        )

        db.BookingDetail.update(
          {
            status: STATUS.ACTIVE,
          },
          {
            where: {
              bookingId: bookingId,
            },
            individualHooks: true,
          }
        )

        db.Transaction.update(
          {
            transactionCode: ipnData.transId,
            transactionType: TRANSACTION_TYPE.MOMO,
            isPaidToManager: true,
            status: STATUS.PAID,
          },
          {
            where: {
              bookingId: bookingId,
            },
            individualHooks: true,
          }
        )

        resolve({
          status: StatusCodes.OK,
          data: {
            msg: "Payment process successfully!",
          },
        })
      } else {
        // Payment fail
        resolve({
          status: StatusCodes.BAD_REQUEST,
          data: {
            msg: "Payment process failed!",
            bookingId: bookingId,
          },
        })
      }
    } catch (error) {
      console.error(error)
      resolve({
        status: 500,
        data: {
          msg: "Error processing payment",
        },
      })
    }
  })

function calculateTotalTime(routeSegments, startTime, departureStationId) {
  const averageSpeedKmPerHour = 30
  const metersPerKilometer = 1000
  const millisecondsPerHour = 60 * 60 * 1000
  const additionalTimeAtStation = 5 * 60 * 1000 // 5 minutes in milliseconds

  const averageSpeedMetersPerMillisecond =
    (averageSpeedKmPerHour * metersPerKilometer) / millisecondsPerHour

  let totalSegmentTime = 0

  for (const segment of routeSegments) {
    if (segment.departureStationId === departureStationId) {
      break
    }

    const timeTaken = segment.distance / averageSpeedMetersPerMillisecond + additionalTimeAtStation
    totalSegmentTime += timeTaken
  }

  const estimatedArrivalTime = startTime + totalSegmentTime

  return new Date(estimatedArrivalTime)
}

const paymentOffline = (bookingId) =>
  new Promise(async (resolve, reject) => {
    try {
      const booking = await db.Booking.findOne({
        where: {
          bookingId: bookingId
        },
        include: {
          model: db.Transaction,
          as: "booking_transaction"
        }
      })

      if (!booking) {
        resolve({
          status: StatusCodes.NOT_FOUND,
          data: {
            msg: `Booking not found!`,
          },
        })
      } else {
        if (STATUS.PAID === booking.booking_transaction.status) {
          resolve({
            status: StatusCodes.BAD_REQUEST,
            data: {
              msg: `Booking transaction already paid!`,
            },
          })
        } else {
          db.Booking.update(
            {
              bookingStatus: BOOKING_STATUS.ON_GOING,
              isAttended: true,
            },
            {
              where: {
                bookingId: bookingId,
              },
              individualHooks: true,
            }
          )

          db.BookingDetail.update(
            {
              status: STATUS.ACTIVE,
            },
            {
              where: {
                bookingId: bookingId,
              },
              individualHooks: true,
            }
          )

          db.Transaction.update(
            {
              status: STATUS.PAID,
            },
            {
              where: {
                bookingId: bookingId,
              },
              individualHooks: true,
            }
          )

          resolve({
            status: StatusCodes.OK,
            data: {
              msg: "Payment offline process successfully!",
            },
          })
        }
      }
    } catch (error) {
      console.log(error)
      reject(error)
    }
  })

module.exports = {
  createMoMoPaymentRequest,
  createPayOsPaymentRequest,
  refundMomo,
  getMoMoPaymentResponse,
  getPayOsPaymentResponse,
  paymentOffline,
}
