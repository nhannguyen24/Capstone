const CustomAPIError = require('./CustomApi');
const UnauthenticatedError = require('./Unauthenticated');
const NotFoundError = require('./NotFound');
const BadRequestError = require('./BadRequest');
const InternalServerError = require('./InternalError');

module.exports = {
  CustomAPIError,
  UnauthenticatedError,
  NotFoundError,
  BadRequestError,
  InternalServerError,
}
