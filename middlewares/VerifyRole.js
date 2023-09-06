const {UnauthenticatedError} = require('../errors/Index');

const isAdmin = (req, res, next) => {
    const { roleName } = req.user;
    if (roleName !== 'Admin') 
    throw new UnauthenticatedError('Require role Admin');
    next();
};

const isSeller = (req, res, next) => {
    const { roleName } = req.user;
    if (roleName !== 'Seller') 
    throw new UnauthenticatedError('Require role Seller');
    next();
};

const isAdminOrSeller = (req, res, next) => {
    const { roleName } = req.user;
    if (roleName !== 'Admin' && roleName !== 'Seller') {
      throw new UnauthenticatedError('Require role Admin or Seller');
    }
    next();
  };

module.exports = {isAdmin, isSeller, isAdminOrSeller};