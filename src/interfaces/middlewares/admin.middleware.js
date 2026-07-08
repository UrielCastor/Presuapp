const { protectRoute } = require('./auth.middleware');
const { formatResponse } = require('../../utils/response');

const protectAdminRoute = [
  protectRoute,
  (req, res, next) => {
    if (req.user && req.user.role === 'ADMIN') {
      next();
    } else {
      return res.status(403).json(formatResponse(false, null, 'Acceso denegado. Se requieren permisos de administrador.'));
    }
  }
];

module.exports = { protectAdminRoute };
