require('express-async-errors');

const auth = require('./AuthRouter');
const role = require('./RoleRouter');
const user = require('./UserRouter');
const station = require('./StationRouter');
//const feedback = require('./FeedbackRouter');
const bus = require('./BusRouter')
const booking = require('./BookingRouter')
const ticketType = require('./TicketTypeRouter')
const ticket = require('./TicketRouter')
const price = require('./PriceRouter')
const point = require('./PointOfInterestRouter')
const uploadImage = require('./UploadFileRouter')
const tour = require('./TourRouter');
const transaction = require('./TransactionRouter');
const route = require('./RouteRouter');
const schedule = require('./ScheduleRouter');
const productCate = require('./ProductCategoryRouter')
const otp = require("./OtpRouter")
const payment = require('./PaymentRouter');
const announcement = require('./AnnouncementRouter');
const report = require('./ReportRouter');
const product = require('./ProductRouter');
const language = require('./LanguageRouter');
const sound = require('./SoundRouter');
const form = require('./FormRouter');

// const stripe = require('./payment');


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
    //app.use('/api/v1/feedbacks', feedback);
    app.use('/api/v1/roles', role);
    app.use('/api/v1/transactions', transaction);
    app.use('/api/v1/points', point);
    app.use('/api/v1/routes', route);
    app.use('/api/v1/otp', otp);
    app.use('/api/v1/firebase', uploadImage);
    app.use('/api/v1/tours', tour);
    // app.use('/api/v1/schedules', schedule);
    app.use('/api/v1/productCates', productCate);
    app.use('/api/v1/announcements', announcement);
    app.use('/api/v1/payments', payment);
    app.use('/api/v1/reports', report);
    app.use('/api/v1/products', product);
    app.use('/api/v1/languages', language);
    app.use('/api/v1/sounds', sound);
    app.use('/api/v1/forms', form);


    // app.post('/api/v1/payments/momo-ipn');
    // app.use('/api/v1/categories-detail', category_detail);
    // app.use('/api/v1/stripe', stripe);
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
