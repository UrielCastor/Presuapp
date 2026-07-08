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
    req.user = await userRepository.findById(decoded.id);
    if (!req.user) throw new Error('User not found');
    next();
  } catch (error) {
    return res.status(401).json(formatResponse(false, null, 'Not authorized, token failed'));
  }
};

module.exports = { protectRoute };
