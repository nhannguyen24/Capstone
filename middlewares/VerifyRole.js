const { UnauthenticatedError } = require('../errors/Index');

const roleAuthen = (roles) => {
  return (req, res, next) => {
    const { roleName } = req.user;
    if (roles.length === 0) {
      next();
    } else {
      if (roles.some((role) => roleName.includes(role))) {
        next();
      } else {
        throw new UnauthenticatedError(`Require role ${roles.join(' or ')}`);
      }
    }
  };
};

module.exports = { roleAuthen };
