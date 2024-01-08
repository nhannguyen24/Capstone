require("dotenv").config();
const cron = require('node-cron');
const {deleteExpiredOtp, deleteUnPaidBooking, cancelTourAndRefundIfUnderbooked, rejectForm} = require('./BackgroundJobs/jobScheduling');
const express = require("express");
const app = express();
const cors = require("cors");
const initRoutes = require("./routes/Index");
const swaggerUi = require("swagger-ui-express");
const swaggerJSDoc = require("swagger-jsdoc");
require("./config/ConnectionDatabase");
const compression = require('compression');
const service = require('./services/PaymentService');

app.use(
  compression({
    threshold: 0
  })
)
app.use(express.urlencoded({ extended: false }));
app.use(express.static("client"));

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
);

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "NBTour API",
      version: "1.0.0",
    },
    servers: [
      {
        url: process.env.SWAGGER_URL || "http://localhost:3000",
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
        },
      },
    },
    tags: [
      { name: "Authentication" },
      { name: "User" },
      { name: "Tour" }, 
      { name: "Schedule" }, 
      { name: "Statistic" },
      { name: "Booking" }, 
      { name: "OTP" }, 
      { name: "Payment" }, 
      { name: "Transaction" }, 
    ],
  },

  apis: ["./routes/*js"],
};

const specs = swaggerJSDoc(options);

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));

const PORT = process.env.PORT || 3000;

app.post('/api/v1/stripe/webhook', express.raw({type: "*/*"}), service.stripeWebhook);

app.use(express.json());

initRoutes(app);

const start = () => {
  try {
    app.listen(PORT, () => {
      console.log(`Server is listening on ${PORT}...`);
      cron.schedule('*/30 * * * *', () => {
        deleteExpiredOtp()
        // deleteUnPaidBooking()
        // rejectForm()
      })
      // cron.schedule('00 00,00 * * *', () => {
      //   cancelTourAndRefundIfUnderbooked()
      // })
    });
  } catch (error) {
    console.log(error);
  }
};

start();
