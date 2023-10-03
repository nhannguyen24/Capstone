require('express-async-errors');
const crypto = require('crypto');

const auth = require('./AuthRouter');
const role = require('./RoleRouter');
const user = require('./UserRouter');
const station = require('./StationRouter');
const feedback = require('./FeedbackRouter');
const bus = require('./BusRouter')
const booking = require('./BookingRouter')
const ticketType = require('./TicketTypeRouter')
const ticket = require('./TicketRouter')
const price = require('./PriceRouter')
const point = require('./PointOfInterestRouter')
const uploadImage = require('./UploadFileRouter')
const tour = require('./TourRouter');
const Transaction = require('./TransactionRouter');
const route = require('./RouteRouter');
const schedule = require('./ScheduleRouter');
const productCate = require('./ProductCategoryRouter')
const otp = require("./OtpRouter")
const payment = require('./PaymentRouter');
const announcement = require('./AnnouncementRouter');
const product = require('./ProductRouter');

// const order_detail = require('./order_detail');
// const order = require('./order');

// const stripe = require('./payment');
// const blog = require('./blog');

// const firebaseService = require('./firebaseService');
// const statistic = require('./statistic')
// const stripe = require('./payment');
// const mail = require('./forgotPassword');

const notFoundMiddleware = require('../middlewares/NotFound');
const errorHandlerMiddleware = require('../middlewares/ErrorHandler');

const initRoutes = (app) => {
    app.use('/api/v1/auth', auth);
    app.use('/api/v1/roles', role);
    app.use('/api/v1/users', user);
    app.use('/api/v1/buses', bus);
    app.use('/api/v1/bookings', booking);
    app.use('/api/v1/prices', price);
    app.use('/api/v1/tickets', ticket);
    app.use('/api/v1/ticket-types', ticketType);
    app.use('/api/v1/stations', station);
    app.use('/api/v1/feedbacks', feedback);
    app.use('/api/v1/roles', role);
    app.use('/api/v1/transactions', Transaction);
    app.use('/api/v1/points', point);
    app.use('/api/v1/routes', route);
    app.use('/api/v1/otp', otp);
    app.use('/api/v1/firebase', uploadImage);
    app.use('/api/v1/tours', tour);
    app.use('/api/v1/schedules', schedule);
    app.use('/api/v1/productCates', productCate);
    app.use('/api/v1/announcements', announcement);
    app.use('/api/v1/payments', payment);
    app.use('/api/v1/products', product);

    app.post('/api/v1/payments/momo-ipn', (req, res) => {
        try {
          console.log('aaa');
          // Parse the JSON data from MoMo IPN
          const ipnData = req.body;
      
          // Verify the signature
          const expectedSignature = crypto
            .createHmac('sha256', secretkey)
            .update(rawSignature) // Recreate the raw signature as you did before
            .digest('hex');
      
          if (ipnData.signature === expectedSignature) {
            // Signature is valid
            // Process the payment status and update your database
            // Send a response with status 200 to acknowledge receipt
            console.log(res);
            res.status(200).send('IPN received and processed successfully');
          } else {
            // Invalid signature, do not trust the IPN
            res.status(400).send('Invalid signature');
          }
        } catch (error) {
          console.error(error);
          res.status(500).send('Error processing IPN');
        }
      });

    // app.use('/api/v1/categories-detail', category_detail);
    // app.use('/api/v1/order-detail', order_detail);
    // app.use('/api/v1/orders', order);
    // app.use('/api/v1/categories_detail', category_detail);
    
    // app.use('/api/v1/stripe', stripe);
    // app.use('/api/v1/blogs', blog);

    // app.use('/api/v1/statistic', statistic);
    // app.use('/api/v1/stripe', stripe);
    // app.use('/api/v1/forgotpass', mail);

    // app.use('/', (req, res) => {
    //     res.status(403).json({ msg: "Unauthorized", date: date_ob.toISOString().slice(0,19)})
    // });

    app.use(notFoundMiddleware);
    app.use(errorHandlerMiddleware);
}

module.exports = initRoutes;
