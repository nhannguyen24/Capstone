const db = require('../models')
const { Op } = require('sequelize')
const cron = require('node-cron')
const STATUS = require("../enums/StatusEnum")
const TOUR_STATUS = require("../enums/TourStatusEnum")
const BOOKING_STATUS = require("../enums/BookingStatusEnum")

async function deleteExpiredOtp() {
  console.log("Delete expired otp starting...")
  try {
    const currentDate = new Date()
    currentDate.setHours(currentDate.getHours() + 7)
    await db.Otp.destroy({
      where: {
        timeExpired: {
          [Op.lte]: currentDate,
        },
      },
    }).then(deletedRows => {
      if (deletedRows > 0) {
        console.log(`Successfully deleted ${deletedRows} expired OTP records.`);
      } else {
        console.log('No expired OTP records were found and deleted.');
      }
    })
      .catch(error => {
        console.error('Error deleting expired OTPs:', error);
      });

  } catch (error) {
    console.error('Error deleting expired OTPs:', error)
  }
  console.log("Delete expired otp done.")
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
        tourStatus: TOUR_STATUS.AVAILABLE,
      },
      attributes: ["tourId"]
    })

    if (tours.length === 0) {
      console.log("No under booked tour were found.")
    } else {
      // tours.map((tourId) => {
      //   console.log(tourId)
      // })
      console.log(tours)
      //for (const tourId of tours) {
        const bookings = await db.BookingDetail.findAll({
          raw: true,
          nest: true,
          include: [
            {
              model: db.Ticket,
              as: "booking_detail_ticket",
              where: {
                tourId: '067a26be-f5dd-4d53-892b-f45104113f98'
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
          ],
          //group: "bookingId"
        })
        //console.log(bookings)
      //}
    }
  } catch (error) {
    console.error('Error cancel and refund under booked tours:', error)
  }
  console.log("Cancel tour and refund job done.")
}

async function deleteUnPaidBooking() {
  try {
    console.log(`Delete unpaid booking starting...`)
    const currentDate = new Date()
    currentDate.setHours(currentDate.getHours() + 6)
    await db.Transaction.destroy({
      where: {
        isSuccess: false,
        updatedAt: {
          [Op.lte]: currentDate,
        },
      },
    }).then(deletedRows => {
      if (deletedRows > 0) {
        console.log(`Successfully deleted ${deletedRows} transaction records.`);
      } else {
        console.log('No transaction records were found and deleted.');
      }
    })
      .catch(error => {
        console.error('Error deleting transactions:', error);
      });

    await db.BookingDetail.destroy({
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
        console.log('No unpaid booking detail records were found and deleted.');
      }
    })
      .catch(error => {
        console.error('Error deleting unpaid booking details:', error);
      });

    await db.Booking.destroy({
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
        console.log('No unpaid booking records were found and deleted.');
      }
    })
      .catch(error => {
        console.error('Error deleting unpaid booking:', error);
      });

  } catch (error) {
    console.error('Error deleting Un-paid bookings:', error)
  }
  console.log(`Delete unpaid booking done.`)
}

module.exports = { deleteExpiredOtp, deleteUnPaidBooking, cancelTourAndRefundIfUnderbooked }
//At second :00, every 30 minutes starting at minute :00, every hour starting at 00am, of every day