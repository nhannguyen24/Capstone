const firebase = require("../config/FirebaseConfig");

const pushNotification = (req, res) => {
    // const { error } = joi
    //   .object({ title, body, device_token })
    //   .validate( req.body );
    // if (error) throw new BadRequestError(error.details[0].message);
    const currentDate = new Date();
    currentDate.setHours(currentDate.getHours() + 7);

    let android = {
        ttl: 360000,
        data: {
            title: req.body.title,
            body: req.body.content,
        }
    }

    const message = {
        android: android,
        token: req.body.device_token,
    };

    firebase.admin
        .messaging()
        .send(message)
        .then((response) => {
            // console.log("Successfully sent message:", response);
            // Handle success
            return res.status(200).json({ msg: "Successfully sent message", notiType: req.body.notiType });
        })
        .catch((error) => {
            if (error.code === 'messaging/invalid-registration-token') {
                console.error('Invalid registration token:', error.message);
                // Handle invalid token error
            } else {
                console.error('Error sending message:', error);
                // Handle other errors
            }
        });
};

const pushNotiMutipleDevices = (req, res) => {
    // const { error } = joi
    //   .object({ title, body, device_token })
    //   .validate( req.body );
    // if (error) throw new BadRequestError(error.details[0].message);
    let android = {
        type: req.body.type,
        data: {
            title: req.body.title,
            body: req.body.content,
        }
    }
    const registrationTokens = req.body.device_token;

    const message = {
        android: android,
        token: registrationTokens,
    };

    firebase.admin
        .messaging()
        .send(message)
        .then((response) => {
            // console.log("Successfully sent message:", response);
            // Handle success
            return res.status(200).json({ msg: "Successfully sent message" });
        })
        .catch((error) => {
            if (error.code === 'messaging/invalid-registration-token') {
                console.error('Invalid registration token:', error.message);
                // Handle invalid token error
            } else {
                console.error('Error sending message:', error);
                // Handle other errors
            }
        });
};

module.exports = { pushNotification, pushNotiMutipleDevices };