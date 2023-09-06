const multer = require("multer");
const firebase = require("../config/firebase_config");
const { NotFoundError } = require("../errors/Index");
// const request = require("request");
const path = require("path");
const joi = require("joi");
const fs = require("fs");
const { title, body, device_token } = require("../helpers/joi_schema");

const parentDirectory = path.dirname(__dirname);

const uploadFile = async (req, res, next) => {
  const upload = multer({
    storage: multer.memoryStorage(),
  });

  upload.array("files", 10)(req, res, async () => {
    if (!req.files) {
      throw new NotFoundError("No files found");
    }

    const uploadPromises = req.files.map(file => {
      const blob = firebase.bucket.file(file.originalname);

      const blobWriter = blob.createWriteStream({
        metadata: {
          contentType: file.mimetype,
        },
      });

      return new Promise((resolve, reject) => {
        blobWriter.on("error", async (err) => {
          console.log(err);
          await firebase.storage().bucket().file(file.originalname).delete();
          reject(new Error("Upload file to Firebase error!"));
        });

        blobWriter.on("finish", () => {
          console.log(`File upload ${file.originalname}`);
        });

        blobWriter.end(file.buffer);

        blob.getSignedUrl({
          action: "read",
          expires: "10-17-2023", // expiration date in mm-dd-yyyy format
        })
          .then(([url]) => {
            resolve(url);
          })
          .catch((err) => {
            console.log(err);
            reject(new Error("Get signed URL from Firebase error!"));
          });
      });
    });

    try {
      const urls = await Promise.all(uploadPromises);
      return res.status(200).json({ files: urls });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  });
};

const pushNotification = (req, res) => {
  const { error } = joi
    .object({ title, body, device_token })
    .validate( req.body );
  if (error) throw new BadRequestError(error.details[0].message);
  const message = {
    notification: {
      title: req.body.title,
      body: req.body.content,
    },
    token: req.body.device_token,
  };

  firebase
    .messaging()
    .send(message)
    .then((response) => {
      console.log("Successfully sent message:", response);
    })
    .catch((error) => {
      console.log("Error sending message:", error);
    });
};

module.exports =  {uploadFile, pushNotification};
