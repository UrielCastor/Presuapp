const UserRepository = require('../../domain/repositories/UserRepository');
const prisma = require('../database/prisma');
const User = require('../../domain/entities/User');

class PrismaUserRepository extends UserRepository {
  async create(userData) {
    const user = await prisma.user.create({
      data: userData,
      include: { membership: true }
    });
    return new User(user);
  }

  async findByEmail(email) {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { membership: true }
    });
    if (!user) return null;
    return new User(user);
  }

  async findById(id) {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) },
      include: { membership: true }
    });
    if (!user) return null;
    return new User(user);
  }

  async findByEmailOrUsername(emailOrUsername) {
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: emailOrUsername },
          { username: emailOrUsername }
        ]
      },
      include: { membership: true }
    });
    if (!user) return null;
    return new User(user);
  }

  async findByUsername(username) {
    if (!username) return null;
    const user = await prisma.user.findUnique({
      where: { username },
      include: { membership: true }
    });
    if (!user) return null;
    return new User(user);
  }

  async searchProfessionals(query) {
    const whereClause = {};
    if (query) {
      const q = query.trim().toLowerCase();
      whereClause.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { city: { contains: q, mode: 'insensitive' } },
        { locality: { contains: q, mode: 'insensitive' } },
        {
          professions: {
            some: {
              name: { contains: q, mode: 'insensitive' }
            }
          }
        }
      ];
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      include: {
        membership: true,
        professions: true
      },
      orderBy: [
        { userType: 'desc' },
        { name: 'asc' }
      ]
    });

    return users.map(u => new User(u));
  }

  async updateMembership(userId, membershipData) {
    const { startDate, endDate, status, planType } = membershipData;
    
    await prisma.$transaction([
      prisma.user.update({
        where: { id: parseInt(userId) },
        data: { userType: planType }
      }),
      prisma.membership.upsert({
        where: { userId: parseInt(userId) },
        update: {
          startDate,
          endDate,
          status,
          planType,
          autoRenew: true
        },
        create: {
          userId: parseInt(userId),
          startDate,
          endDate,
          status,
          planType,
          autoRenew: true
        }
      })
    ]);
  }
}
module.exports = PrismaUserRepository;
