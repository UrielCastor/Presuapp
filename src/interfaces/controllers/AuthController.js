const AuthUseCases = require('../../application/use-cases/AuthUseCases');
const PrismaUserRepository = require('../../infrastructure/repositories/PrismaUserRepository');
const { formatResponse } = require('../../utils/response');

const userRepository = new PrismaUserRepository();
const authUseCases = new AuthUseCases(userRepository);

class AuthController {
  static async register(req, res, next) {
    try {
      const { name, email, password, username, city, locality } = req.body;
      const { user, token } = await authUseCases.register({ name, email, password, username, city, locality });
      
      const userResponse = {
        id: user.id,
        name: user.name,
        email: user.email,
        username: user.username,
        city: user.city,
        locality: user.locality,
        userType: user.userType,
        membership: user.membership,
        role: user.role,
        status: user.status
      };
      
      res.status(201).json(formatResponse(true, { user: userResponse, token }, 'User registered successfully'));
    } catch (error) {
      if (error.message === 'Email already registered' || error.message === 'Username already registered') {
        return res.status(400).json(formatResponse(false, null, error.message));
      }
      next(error);
    }
  }

  static async login(req, res, next) {
    try {
      const { email, username, password } = req.body;
      const loginPayload = email || username || req.body.login; // Soportar cualquier nombre de campo entrante
      
      const { user, token } = await authUseCases.login(loginPayload, password);
      
      const userResponse = {
        id: user.id,
        name: user.name,
        email: user.email,
        username: user.username,
        city: user.city,
        locality: user.locality,
        userType: user.userType,
        membership: user.membership,
        role: user.role,
        status: user.status
      };
      
      res.status(200).json(formatResponse(true, { user: userResponse, token }, 'Logged in successfully'));
    } catch (error) {
      if (error.message === 'Invalid credentials') {
        return res.status(401).json(formatResponse(false, null, error.message));
      }
      if (error.message.includes('cuenta ha sido suspendida')) {
        return res.status(403).json(formatResponse(false, null, error.message));
      }
      next(error);
    }
  }

  static async me(req, res, next) {
    try {
      const freshUser = await userRepository.findById(req.user.id);
      
      const userResponse = {
        id: freshUser.id,
        name: freshUser.name,
        email: freshUser.email,
        username: freshUser.username,
        city: freshUser.city,
        locality: freshUser.locality,
        userType: freshUser.userType,
        membership: freshUser.membership
      };
      
      res.status(200).json(formatResponse(true, userResponse, 'Fresh profile fetched'));
    } catch (e) {
      next(e);
    }
  }
}

module.exports = AuthController;
