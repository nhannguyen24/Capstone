const db = require('../models')
const { Op } = require('sequelize')
const cron = require('node-cron')
const STATUS = require("../enums/StatusEnum")
async function deleteExpiredOtp() {
    try {
        const currentDate = new Date()
        currentDate.setHours(currentDate.getHours() + 7)
        await db.OTP.destroy({
          where: {
            expiredTime: {
              [Op.lte]: currentDate,
            },
          },
        })
        console.log('Expired OTPs deleted.')
      } catch (error) {
        console.error('Error deleting expired OTPs:', error)
      }
}

async function deleteUnPaidBooking() {
    try {
        const currentDate = new Date()
        currentDate.setHours(currentDate.getHours() + 6)
        await db.Transaction.destroy({
            where: {
                isSuccess: false,
                updatedAt: {
                  [Op.lte]: currentDate,
                },
              },
        })

        await db.BookingDetail.destroy({
          where: {
            status: STATUS.DRAFT,
            expiredTime: {
              [Op.lte]: currentDate,
            },
          },
        })

        await db.Booking.destroy({
          where: {
            status: STATUS.DRAFT,
            expiredTime: {
              [Op.lte]: currentDate,
            },
          },
        })
        console.log('Un-paid Booking process (Booking, BookingDetail, Transaction) deleted.')
      } catch (error) {
        console.error('Error deleting Un-paid bookings:', error)
      }
}

//At second :00, every 30 minutes starting at minute :00, every hour starting at 00am, of every day
cron.schedule("*/30 * * * *", () =>{
    deleteExpiredOtp()
    deleteUnPaidBooking()
})