const db = require('../models')
const { Op } = require('sequelize')
const STATUS = require("../enums/StatusEnum")
const TOUR_STATUS = require("../enums/TourStatusEnum")
const TRANSACTION_TYPE = require("../enums/TransactionTypeEnum")
const BOOKING_STATUS = require("../enums/BookingStatusEnum")
const PaymentService = require('../services/PaymentService')

async function deleteExpiredOtp() {
  console.log("Delete expired otp starting...")
  try {
    const currentDate = new Date()
    currentDate.setHours(currentDate.getHours() + 7)
    db.Otp.destroy({
      where: {
        timeExpired: {
          [Op.lte]: currentDate,
        },
      },
    }).then(deletedRows => {
      if (deletedRows > 0) {
        console.log(`Successfully deleted ${deletedRows} expired OTP records.`);
      } else {
        console.log('No expired OTP records were found.');
      }
    })
      .catch(error => {
        console.error('Error deleting expired OTPs:', error);
      });

  } catch (error) {
    console.error('Error deleting expired OTPs:', error)
  }
}

async function cancelTourAndRefundIfUnderbooked() {
  console.log("Cancel tour and refund job starting...")
  try {
    const currentDate = new Date()
    currentDate.setHours(currentDate.getHours() + 7)
    const tours = await db.Tour.findAll({
      raw: true,
      where: {
        endBookingDate: {
          [Op.lte]: currentDate
        },
        tourStatus: TOUR_STATUS.AVAILABLE
      },
      attributes: ["tourId"]
    })

    if (tours.length === 0) {
      console.log("No under booked tours were found.")
    } else {
      for (const tour of tours) {
        const bookings = await db.BookingDetail.findAll({
          raw: true,
          nest: true,
          include: [
            {
              model: db.Ticket,
              as: "booking_detail_ticket",
              where: {
                tourId: tour.tourId
              }
            },
            {
              model: db.Booking,
              as: "detail_booking",
              attributes: ["bookingId"],
              where: {
                bookingStatus: BOOKING_STATUS.ON_GOING
              }
            }
          ]
        })

        var totalBookedTickets = 0
        bookings.map((booking) => {
          totalBookedTickets += booking.quantity
        })

        if (totalBookedTickets < 5) {
          const bookingIdList = Array.from(
            new Set(bookings.map((booking) => booking.bookingId))
          )

          await db.sequelize.transaction(async (t) => {
            for (const bookingId of bookingIdList) {
              const transaction = await db.Transaction.findOne({
                raw: true,
                where: {
                  bookingId: bookingId
                }
              })

              if (transaction) {
                const amount = parseInt(transaction.amount)

                if (transaction.transactionType === TRANSACTION_TYPE.MOMO) {
                  const refundResult = await PaymentService.refundMomo(
                    bookingId,
                    amount
                  )

                  if (refundResult?.status === StatusCodes.OK) {
                    await Promise.all([
                      db.Booking.update(
                        { bookingStatus: BOOKING_STATUS.CANCELED },
                        { where: { bookingId: bookingId }, transaction: t }
                      ),
                      db.BookingDetail.update(
                        { status: BOOKING_STATUS.CANCELED },
                        { where: { bookingId: bookingId }, transaction: t }
                      ),
                      db.Transaction.update(
                        {
                          refundAmount: amount,
                          status: STATUS.REFUNDED
                        },
                        { where: { bookingId: bookingId }, transaction: t }
                      )
                    ])
                    console.log(`Refund to booking: ${bookingId}`)
                  } else {
                    console.error(`Error refund to: ${bookingId}`)
                  }
                } else if (
                  transaction.transactionType === TRANSACTION_TYPE.PAY_OS
                ) {
                  await Promise.all([
                    db.Booking.update(
                      { bookingStatus: BOOKING_STATUS.CANCELED },
                      { where: { bookingId: bookingId }, transaction: t }
                    ),
                    db.BookingDetail.update(
                      { status: BOOKING_STATUS.CANCELED },
                      { where: { bookingId: bookingId }, transaction: t }
                    ),
                    db.Transaction.update(
                      { status: STATUS.REFUNDED },
                      { where: { bookingId: bookingId }, transaction: t }
                    )
                  ])
                  console.log(`Booking canceled (No refund Pay-Os): ${bookingId}`)
                }
              }
            }

            await db.Tour.update(
              { tourStatus: TOUR_STATUS.CANCELED },
              { where: { tourId: tour.tourId }, transaction: t }
            )
            console.log("Cancel tour: ", tour.tourId)
          })
        }
      }
    }
  } catch (error) {
    console.error('Error cancel and refund under booked tours:', error)
  }
}

function deleteUnPaidBooking() {
  try {
    console.log(`Delete unpaid booking starting...`)
    const currentDate = new Date()
    currentDate.setHours(currentDate.getHours() + 6)
    db.Transaction.destroy({
      where: {
        status: STATUS.DRAFT,
        updatedAt: {
          [Op.lte]: currentDate,
        },
      },
    }).then(deletedRows => {
      if (deletedRows > 0) {
        console.log(`Successfully deleted ${deletedRows} transaction records.`);
      } else {
        console.log('No transaction records were found.');
      }
    })
      .catch(error => {
        console.error('Error deleting transactions:', error);
      });

    db.BookingDetail.destroy({
      where: {
        status: STATUS.DRAFT,
        updatedAt: {
          [Op.lte]: currentDate,
        },
      },
    }).then(deletedRows => {
      if (deletedRows > 0) {
        console.log(`Successfully deleted ${deletedRows} unpaid booking detail records.`);
      } else {
        console.log('No unpaid booking detail records were found.');
      }
    })
      .catch(error => {
        console.error('Error deleting unpaid booking details:', error);
      });

    db.Booking.destroy({
      where: {
        bookingStatus: STATUS.DRAFT,
        updatedAt: {
          [Op.lte]: currentDate,
        },
      },
    }).then(deletedRows => {
      if (deletedRows > 0) {
        console.log(`Successfully deleted ${deletedRows} unpaid booking records.`);
      } else {
        console.log('No unpaid booking records were found.');
      }
    })
      .catch(error => {
        console.error('Error deleting unpaid booking:', error);
      });

  } catch (error) {
    console.error('Error deleting Un-paid bookings:', error)
  }
}

module.exports = { deleteExpiredOtp, deleteUnPaidBooking, cancelTourAndRefundIfUnderbooked }