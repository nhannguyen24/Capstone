const { UnauthenticatedError } = require('../errors/Index');

const isAdmin = (req, res, next) => {
  const { roleName } = req.user;
  if (roleName !== 'Admin')
    throw new UnauthenticatedError('Require role Admin');
  next();
};

const isManager = (req, res, next) => {
  const { roleName } = req.user;
  if (roleName !== 'Manager')
    throw new UnauthenticatedError('Require role Manager');
  next();
};

const isCustomer = (req, res, next) => {
  const { roleName } = req.user;
  if (roleName !== 'Customer')
    throw new UnauthenticatedError('Require role Customer');
  next();
};

const isAdminOrManager = (req, res, next) => {
  const { roleName } = req.user;
  if (roleName !== 'Admin' && roleName !== 'Manager') {
    throw new UnauthenticatedError('Require role Admin or Manager');
  }
  next();
};

const isAdminOrManagerOrTourguideOrDriver = (req, res, next) => {
  const { roleName } = req.user;
  if (roleName !== 'TourGuide' && roleName !== 'Driver' && roleName !== 'Admin' && roleName !== 'Manager') {
    throw new UnauthenticatedError('Require role Admin or Manager or TourGuide or Driver');
  }
  next();
};

const isTourguideOrDriver = (req, res, next) => {
  const { roleName } = req.user;
  if (roleName !== 'TourGuide' && roleName !== 'Driver') {
    throw new UnauthenticatedError('Require role TourGuide or Driver');
  }
  next();
};

const isLoggedIn = (req, res, next) => {
  const { roleName } = req.user;
  if (!roleName) {
    throw new UnauthenticatedError('Authentication invalid');
  }
  next();
};

module.exports = { isAdmin, isManager, isAdminOrManager, isCustomer, isTourguideOrDriver, isLoggedIn, isAdminOrManagerOrTourguideOrDriver };
