const { hashPassword, comparePassword } = require('../../utils/hash');
const { generateToken } = require('../../utils/jwt');
const prisma = require('../../infrastructure/database/prisma');

class AuthUseCases {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  async register({ name, email, password, username: inputUsername, city, locality }) {
    const existingEmail = await this.userRepository.findByEmail(email);
    if (existingEmail) {
      throw new Error('Email already registered');
    }

    // Autogenerar username del email si no se proporciona
    let username = (inputUsername || '').trim();
    if (!username) {
      username = email.split('@')[0];
    }

    // Asegurar que el username sea único
    const existingUsername = await this.userRepository.findByUsername(username);
    if (existingUsername) {
      throw new Error('Username already registered');
    }

    const hashedPassword = await hashPassword(password);
    
    // Verificar si ya existe al menos un usuario ADMIN
    const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });
    const assignedRole = adminCount === 0 ? 'ADMIN' : 'USER';

    const user = await this.userRepository.create({
      name,
      email,
      password: hashedPassword,
      username,
      city: city || null,
      locality: locality || null,
      userType: 'FREE', // Todos los usuarios nuevos son FREE por defecto
      role: assignedRole
    });

    const token = generateToken(user.id);
    return { user, token };
  }

  async login(emailOrUsername, password) {
    // Buscar por email o username indistintamente
    const user = await this.userRepository.findByEmailOrUsername(emailOrUsername);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      throw new Error('Invalid credentials');
    }

    if (user.status === 'SUSPENDED') {
      throw new Error('Esta cuenta ha sido suspendida. Contactá al administrador.');
    }

    const token = generateToken(user.id);
    return { user, token };
  }
}

module.exports = AuthUseCases;
