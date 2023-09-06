const { StatusCodes } = require('http-status-codes');
const CustomAPIError = require('./CustomApi');

class BadRequestError extends CustomAPIError {
  constructor(message) {
    super(message);
    this.statusCode = StatusCodes.BAD_REQUEST;
  }
}

module.exports = BadRequestError;
