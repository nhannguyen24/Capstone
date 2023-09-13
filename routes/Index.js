require('express-async-errors');
const auth = require('./AuthRouter');
const user = require('./UserRouter');
const station = require('./StationRouter');
// const store = require('./store');
const role = require('./RoleRouter');
const bus = require('./BusRouter')
const busCate = require('./BusCategoryRoute')
const ticketType = require('./TicketTypeRoute')
const price = require('./PriceRoute')
// const ingredient = require('./ingredient');
// const food = require('./food');
// const category = require('./category');
// const step = require('./guild_step');
// const category_detail = require('./category_detail');
// const order_detail = require('./order_detail');
// const order = require('./order');
// const upload_image = require('./uploadFile');
// const stripe = require('./payment');
// const blog = require('./blog');

// const firebaseService = require('./firebaseService');
// const statistic = require('./statistic')
// const stripe = require('./payment');
// const mail = require('./forgotPassword');

const notFoundMiddleware = require('../middlewares/NotFound');
const errorHandlerMiddleware = require('../middlewares/ErrorHandler');
let date_ob = new Date();

const initRoutes = (app) => {
    app.use('/api/v1/auth', auth);
    app.use('/api/v1/users', user);
    app.use('/api/v1/buses', bus);
    app.use('/api/v1/bus-cates', busCate);
    app.use('/api/v1/prices', price);
    app.use('/api/v1/ticket-types', ticketType);
    app.use('/api/v1/stations', station);
    // app.use('/api/v1/stores', store);
    app.use('/api/v1/roles', role);


    // app.use('/api/v1/statistic', statistic);
    // app.use('/api/v1/stripe', stripe);
    // app.use('/api/v1/forgotpass', mail);

    app.use('/', (req, res) => {
        res.status(403).json({ msg: "Unauthorized", date: date_ob.toISOString().slice(0,19)})
    });

    app.use(notFoundMiddleware);
    app.use(errorHandlerMiddleware);
}

module.exports = initRoutes;
