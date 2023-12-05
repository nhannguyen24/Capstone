const crypto = require("crypto")
const db = require("../models")
const STATUS = require("../enums/StatusEnum")
const mailer = require("../utils/MailerUtil")
const qr = require("qrcode")
const BOOKING_STATUS = require("../enums/BookingStatusEnum")
const { StatusCodes } = require("http-status-codes")
require('dotenv').config()
const createMoMoPaymentRequest = (amounts, redirect, bookingId) =>
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
      var amount = amounts
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
        if (transaction.status === STATUS.PAID) {
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

const createPayOSPaymentRequest = (amount, bookingId) => new Promise(async (resolve, reject) => {
  try {
    var partnerCode = "PAYOS"
    const clientkey = process.env.PAY_OS_CLIENT_KEY
    const apikey = process.env.PAY_OS_API_KEY
    var amount = amount
    var orderCode = partnerCode + new Date().getTime()
    var description = "Pay PayOs"
    var cancelUrl = "https://tour-customer-git-main-quanvtse151000.vercel.app/tour/9bdec9fc-f1ea-4e6d-9b01-ef2add4e34f0"
    var returnUrl = "https://tour-customer-git-main-quanvtse151000.vercel.app"
    //"https://nbtour-fc9f59891cf4.herokuapp.com/api/v1/payments/pay-os-response"

    // const transaction = await db.Transaction.findOne({
    //   where: { bookingId: bookingId },
    //   include: {
    //     model: db.Booking,
    //     as: "transaction_booking",
    //     attributes: ["endPaymentTime"],
    //   },
    // })
    // if (!transaction) {
    //   return {
    //     status: StatusCodes.NOT_FOUND,
    //     data: {
    //       msg: `Booking transaction not found!`,
    //     },
    //   }

    // }
    // if (transaction.status === STATUS.PAID) {
    //   return {
    //     status: StatusCodes.BAD_REQUEST,
    //     data: {
    //       msg: "Booking transaction already paid!",
    //     },
    //   }
    // }
    // const currentDate = new Date()
    // currentDate.setHours(currentDate.getHours() + 7)
    // const endBookingTime = new Date(
    //   transaction.transaction_booking.endPaymentTime
    // )
    // if (endBookingTime <= currentDate) {
    //   resolve({
    //     status: StatusCodes.BAD_REQUEST,
    //     data: {
    //       msg: "Booking transaction expired!",
    //     },
    //   })
    // }

    var rawSignature =
      "&amount=" +
      amount +
      "&cancelURl=" +
      cancelUrl +
      "&description=" +
      description +
      "&orderCode=" +
      orderCode +
      "&returnUrl=" +
      returnUrl

    var signature = crypto
      .createHmac("sha256", apikey.toString())
      .update(rawSignature)
      .digest("hex")

    const requestBody = JSON.stringify({
      orderCode: orderCode,
      amount: amount,
      description: description,
      cancelUrl: cancelUrl,
      returnUrl: returnUrl,
      signature: signature
    })

    //Create the HTTPS objects
    const https = require("https")
    const options = {
      hostname: "https://api-merchant.payos.vn/v2/payment-requests",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(requestBody),
        "x-api-key": apikey,
        "x-client-id": clientkey,
      },
    }

    //Send the request and get the response
    const req = https.request(options, (res) => {
      res.setEncoding("utf8")
      res.on("data", (body) => {
        console.log("request", requestBody)
        console.log("Body: ", JSON.parse(body))
        resolve({
          status: StatusCodes.OK,
          data: {
            msg: "Get link payment successfully!",
            url: JSON.parse(body).data.checkoutUrl,
          },
        })
      })
    })

    req.on("error", (e) => {
      console.log(`Problem with request: ${e}`)
    })

    // write data to request body
    req.write(requestBody)
    req.end()

  } catch (error) {
    console.error(error)
    resolve({
      status: StatusCodes.INTERNAL_SERVER_ERROR,
      data: {
        msg: "Something went wrong!"
      }
    })
  }
})

const refundMomo = async (bookingId, amount) => {
  return new Promise(async (resolve, reject) => {
    try {
      const bookingDetail = await db.BookingDetail.findOne({
        raw: true,
        nest: true,
        where: {
          bookingId: bookingId,
        },
        include: {
          model: db.Ticket,
          as: "booking_detail_ticket",
          attributes: ["ticketId"],
          include: {
            model: db.Tour,
            as: "ticket_tour",
            attributes: ["tourId", "tourName", "departureDate"],
          },
        },
      })
      if (!bookingDetail) {
        return {
          status: StatusCodes.NOT_FOUND,
          data: {
            msg: `Booking not found!`,
          },
        }
      }

      const transaction = await db.Transaction.findOne({
        raw: true,
        nest: true,
        where: {
          bookingId: bookingId,
        },
        include: {
          model: db.Booking,
          as: "transaction_booking",
          attributes: ["bookingCode"],
        },
      })
      if (!transaction) {
        return {
          status: StatusCodes.NOT_FOUND,
          data: {
            msg: `Transaction not found!`,
          },
        }
      } else {
        if (transaction.status === STATUS.DRAFT) {
          return {
            status: StatusCodes.FORBIDDEN,
            data: {
              msg: `Transaction not paid!`,
            },
          }
        } else if (transaction.status === STATUS.REFUNDED) {
          return {
            status: StatusCodes.FORBIDDEN,
            data: {
              msg: `Booking already refunded!`,
            },
          }
        }
        let _amount = parseInt(amount)
        // var partnerCode = "MOMODH1S20220711"
        // var accessKey = "xs6XvGNPuH4AxAL9"
        // var secretkey = "ZTP0gGrCP2KmUnWbjMvtOrAZ7NzCNRzo"
        var partnerCode = "MOMO"
        var accessKey = process.env.MOMO_ACCESS_KEY
        var secretkey = process.env.MOMO_SECRET_KEY
        var requestId = partnerCode + new Date().getTime()
        var orderId = requestId
        var description = "Refund canceled booking"
        var transId = transaction.transactionCode

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
                  msg: `Refund to booking ${transaction.transaction_booking.bookingCode}`,
                  refundAmount: _amount,
                },
              })
            } else {
              resolve({
                status: StatusCodes.BAD_REQUEST,
                data: {
                  msg: `${response.message} For booking ${transaction.transaction_booking.bookingCode}`,
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
          reject({
            status: 500,
            data: {
              msg: "Internal server error",
            },
          })
        })

        req.write(requestBody)
        req.end()
      }

    } catch (error) {
      console.log("Error:", error)
    }
  })
}

const getPayOsPaymentResponse = (req) =>
  new Promise(async (resolve, reject) => {
    resolve({
      status: StatusCodes.OK,
      data: {
        msg: "OK"
      }
    })
  })


const getMoMoPaymentResponse = (req) =>
  new Promise(async (resolve, reject) => {
    try {
      const ipnData = req.body
      const bookingId = ipnData.extraData
      if (ipnData.resultCode === 0) {
        const bookingDetail = await db.BookingDetail.findOne({
          raw: true,
          nest: true,
          where: {
            bookingId: bookingId,
          },
          include: [
            {
              model: db.Ticket,
              as: "booking_detail_ticket",
              include: {
                model: db.Tour,
                as: "ticket_tour",
                attributes: [
                  "tourName",
                  "routeId",
                  "departureDate",
                  "duration",
                  "status",
                ],
                include: {
                  model: db.Bus,
                  as: "tour_bus",
                  attributes: ["busPlate"],
                },
              },
              attributes: {
                exclude: ["tourid", "ticketTypeId", "updatedAt", "createdAt"],
              },
            },
            {
              model: db.Booking,
              as: "detail_booking",
              include: [
                {
                  model: db.User,
                  as: "booking_user",
                  attributes: ["userName", "email"],
                },
                {
                  model: db.Station,
                  as: "booking_departure_station",
                  attributes: ["stationId", "stationName"],
                },
              ],
              attributes: [
                "bookingId",
                "bookingCode",
                "customerId",
                "departureStationId",
                "totalPrice",
              ],
            },
          ],
        })

        const routeSegment = await db.RouteSegment.findAll({
          raw: true,
          nest: true,
          where: {
            routeId: bookingDetail.booking_detail_ticket.ticket_tour.routeId,
          },
          order: [["index", "ASC"]],
        })

        const tourName =
          bookingDetail.booking_detail_ticket.ticket_tour.tourName
        const bookedStationId =
          bookingDetail.detail_booking.booking_departure_station.stationId
        const tourDepartureTime = new Date(
          bookingDetail.booking_detail_ticket.ticket_tour.departureDate
        ).getTime()
        const busArrivalTimeToBookedStation = calculateTotalTime(
          routeSegment,
          tourDepartureTime,
          bookedStationId
        )
        const formatDepartureDate = `${busArrivalTimeToBookedStation
          .getDate()
          .toString()
          .padStart(2, "0")}/${(busArrivalTimeToBookedStation.getMonth() + 1)
            .toString()
            .padStart(
              2,
              "0"
            )}/${busArrivalTimeToBookedStation.getFullYear()}  |  ${busArrivalTimeToBookedStation
              .getHours()
              .toString()
              .padStart(2, "0")}:${busArrivalTimeToBookedStation
                .getMinutes()
                .toString()
                .padStart(2, "0")}:${busArrivalTimeToBookedStation
                  .getSeconds()
                  .toString()
                  .padStart(2, "0")}`
        const tourDuration =
          bookingDetail.booking_detail_ticket.ticket_tour.duration
        const totalPrice = bookingDetail.detail_booking.totalPrice
        const stationName =
          bookingDetail.detail_booking.booking_departure_station.stationName
        const busPlate =
          bookingDetail.booking_detail_ticket.ticket_tour.tour_bus.busPlate
        const bookingCode = bookingDetail.detail_booking.bookingCode

        const qrDataURL = await qr.toDataURL(`bookingId: ${bookingId}`)
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
              `  - Tour Total Price: <b>${totalPrice}</b>`,
            ],
            outro: [
              `If you have any questions or need assistance, please to reach out to our customer support team at nbtour@gmail.com.`,
            ],
            signature: "Sincerely",
          },
        }
        mailer.sendMail(
          bookingDetail.detail_booking.booking_user.email,
          "Tour booking tickets",
          htmlContent,
          qrDataURL
        )
        //Find if there are any product of a booking
        const productOrder = await db.ProductOrder.findOne({
          where: {
            bookingId: bookingDetail.detail_booking.bookingId,
          },
        })

        if (productOrder) {
          await db.ProductOrder.update(
            {
              status: STATUS.ACTIVE,
            },
            {
              where: {
                bookingId: bookingId,
              },
            }
          )
        }

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

    const timeTaken =
      segment.distance / averageSpeedMetersPerMillisecond +
      additionalTimeAtStation
    totalSegmentTime += timeTaken
  }

  const estimatedArrivalTime = startTime + totalSegmentTime

  return new Date(estimatedArrivalTime)
}

const paymentOffline = (bookingId) =>
  new Promise(async (resolve, reject) => {
    try {
      const _bookingId = bookingId
      const bookingDetail = await db.BookingDetail.findOne({
        where: {
          bookingId: _bookingId,
        },
        attributes: ["bookingDetailId"],
        include: [
          {
            model: db.Booking,
            as: "detail_booking",
            where: {
              bookingId: _bookingId,
            },
          },
        ],
      })
      if (!bookingDetail) {
        resolve({
          status: StatusCodes.NOT_FOUND,
          data: {
            msg: `Booking not found!`,
          },
        })
      }

      const transaction = await db.Transaction.findOne({
        where: {
          bookingId: _bookingId,
        },
      })

      if (!transaction) {
        resolve({
          status: StatusCodes.NOT_FOUND,
          data: {
            msg: `Booking transaction not found!`,
          },
        })
      } else {
        if (transaction.status === STATUS.PAID) {
          resolve({
            status: StatusCodes.FORBIDDEN,
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
              msg: "Payment process successfully",
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
  createPayOSPaymentRequest,
  refundMomo,
  getMoMoPaymentResponse,
  getPayOsPaymentResponse,
  paymentOffline,
}
