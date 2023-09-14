const multer = require("multer");
const firebase = require("../config/FirebaseConfig");
const { NotFoundError } = require("../errors/Index");

const uploadFile = async (req, res) => {
  const upload = multer({
    storage: multer.memoryStorage(),
  });

  upload.single("file")(req, res, async () => {
    if (!req.file) {
      throw new NotFoundError("No files found");
    }

    const blob = firebase.bucket.file(req.file.originalname);

    const blobWriter = blob.createWriteStream({
      metadata: {
        contentType: req.file.mimetype,
      },
    });

    blobWriter.on("error", async (err) => {
      console.log(err);
      await firebase.storage().bucket().file(req.file.originalname).delete();
      return res.status(500).json({ message: "Upload file to firebase error!" });
    });

    blobWriter.on("finish", () => {
      console.log(`File upload ${req.file.originalname}`);
    });

    // Get a signed URL for the file
    const file = firebase.bucket.file(req.file.originalname);
    const [url] = await file.getSignedUrl({
      action: "read",
      expires: "01-17-2024", // expiration date in mm-dd-yyyy format
    });

    blobWriter.end(req.file.buffer);
    return res.status(200).json({ url });
  });
};

module.exports =  {uploadFile};







// const pushNotification = (req, res) => {
//   const { error } = joi
//     .object({ title, body, device_token })
//     .validate( req.body );
//   if (error) throw new BadRequestError(error.details[0].message);
//   const message = {
//     notification: {
//       title: req.body.title,
//       body: req.body.content,
//     },
//     token: req.body.device_token,
//   };

//   firebase
//     .messaging()
//     .send(message)
//     .then((response) => {
//       console.log("Successfully sent message:", response);
//     })
//     .catch((error) => {
//       console.log("Error sending message:", error);
//     });
// };


