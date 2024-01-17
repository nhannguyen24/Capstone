require('dotenv').config();

module.exports = {
  "type": process.env.FIREBASE_TYPE,
  "project_id": process.env.FIREBASE_PROJECTID,
  "private_key_id": process.env.FIREBASE_PRIVATEKEYID,
  "private_key": process.env.FIREBASE_PRIVATEKEY,
  "client_email": process.env.FIREBASE_CLIENTEMAIL,
  "client_id": process.env.FIREBASE_CLIENTID,
  "auth_uri": process.env.FIREBASE_AUTHURI,
  "token_uri": process.env.FIREBASE_TOKENURI,
  "auth_provider_x509_cert_url": process.env.FIREBASE_AUTHPROVIDER,
  "client_x509_cert_url": process.env.FIREBASE_CLIENTURL,
  "universe_domain": process.env.UNI_DOMAIN
};