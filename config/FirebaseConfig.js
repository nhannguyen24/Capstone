const admin = require("firebase-admin");

const serviceAccount = require("./ServiceAccount.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "gs://wallet-fpt.appspot.com"
});

const bucket = admin.storage().bucket();
module.exports = { admin, bucket };