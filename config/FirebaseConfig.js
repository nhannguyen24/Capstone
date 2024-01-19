const admin = require("firebase-admin");
require('dotenv').config();

const serviceAccount = require("./ServiceAccount");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "gs://wallet-fpt.appspot.com"
});

const bucket = admin.storage().bucket();
module.exports = { admin, bucket };