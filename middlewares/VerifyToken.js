const jwt = require("jsonwebtoken");
const { TokenExpiredError } = require("jsonwebtoken");
const { UnauthenticatedError } = require("../errors/Index");

const auth = (req, res, next) => {
  // check header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer")) {
    throw new UnauthenticatedError("Authentication invalid");
  }
  const token = authHeader.split(" ")[1];
    const user = jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
          const isChecked = err instanceof TokenExpiredError;
          if (!isChecked) throw new UnauthenticatedError("Access token invalid");
          if (isChecked) throw new UnauthenticatedError("Access token expired");
        }
        req.user = user;
        next();
      });
};

module.exports = auth;
