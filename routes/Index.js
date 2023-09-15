require('express-async-errors');
const auth = require('./AuthRouter');
const role = require('./RoleRouter');
const user = require('./UserRouter');
const station = require('./StationRouter');

const bus = require('./BusRouter')
const ticketType = require('./TicketTypeRoute')
const price = require('./PriceRouter')
const point = require('./PointOfInterestRouter')
const uploadImage = require('./UploadFileRouter')
// const ingredient = require('./ingredient');
const route = require('./RouteRouter');

// const food = require('./food');
// const category = require('./category');
// const step = require('./guild_step');
// const category_detail = require('./category_detail');
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
    app.use('/api/v1/prices', price);
    app.use('/api/v1/ticket-types', ticketType);
    app.use('/api/v1/stations', station);

    app.use('/api/v1/roles', role);

    app.use('/api/v1/points', point);
    app.use('/api/v1/routes', route);

    app.use('/api/v1/upload-image', uploadImage);
    
    // app.use('/api/v1/ingredients', ingredient);
    // app.use('/api/v1/foods', food);
    // app.use('/api/v1/steps', step);
    // app.use('/api/v1/categories', category);
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
