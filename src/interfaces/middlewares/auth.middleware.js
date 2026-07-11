const { verifyToken } = require('../../utils/jwt');
const PrismaUserRepository = require('../../infrastructure/repositories/PrismaUserRepository');
const userRepository = new PrismaUserRepository();
const { formatResponse } = require('../../utils/response');

const protectRoute = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json(formatResponse(false, null, 'Not authorized to access this route'));
  }

  try {
    const decoded = verifyToken(token);
    const user = await userRepository.findById(decoded.id);
    if (!user) throw new Error('User not found');

    // Verificar si la membresía ha expirado
    const membership = user.membership;
    if (membership && membership.status === 'ACTIVE' && new Date(membership.endDate) < new Date()) {
      await userRepository.expireMembership(decoded.id);
      user.userType = 'FREE';
      user.membership.status = 'INACTIVE';
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json(formatResponse(false, null, 'Not authorized, token failed'));
  }
};

module.exports = { protectRoute };
