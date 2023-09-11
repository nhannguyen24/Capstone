const {UnauthenticatedError} = require('../errors');

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

const isAdminOrManager = (req, res, next) => {
    const { roleName } = req.user;
    if (roleName !== 'Admin' && roleName !== 'Manager') {
      throw new UnauthenticatedError('Require role Admin or Manager');
    }
    next();
  };

module.exports = {isAdmin, isManager, isAdminOrManager};
