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

  async checkAndUpdateMembershipExpiration(userId) {
    const membership = await prisma.membership.findUnique({
      where: { userId: parseInt(userId) }
    });

    if (membership && membership.status === 'ACTIVE' && new Date(membership.endDate) < new Date()) {
      await prisma.$transaction([
        prisma.user.update({
          where: { id: parseInt(userId) },
          data: { userType: 'FREE' }
        }),
        prisma.membership.update({
          where: { userId: parseInt(userId) },
          data: { status: 'INACTIVE' }
        })
      ]);
      return true;
    }
    return false;
  }

  async expireMembership(userId) {
    await prisma.$transaction([
      prisma.user.update({
        where: { id: parseInt(userId) },
        data: { userType: 'FREE' }
      }),
      prisma.membership.update({
        where: { userId: parseInt(userId) },
        data: { status: 'INACTIVE' }
      })
    ]);
  }

  async updateMembership(userId, membershipData, paymentTransactionData = null) {
    const { startDate, endDate, status, planType } = membershipData;
    
    await prisma.$transaction(async (tx) => {
      // 1. Actualizar tipo de usuario
      await tx.user.update({
        where: { id: parseInt(userId) },
        data: { userType: planType }
      });

      // 2. Crear o actualizar membresía
      const membership = await tx.membership.upsert({
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
      });

      // 3. Registrar transacción si existe
      if (paymentTransactionData) {
        const existingTx = await tx.paymentTransaction.findUnique({
          where: { mercadoPagoPaymentId: paymentTransactionData.mercadoPagoPaymentId }
        });
        if (!existingTx) {
          await tx.paymentTransaction.create({
            data: {
              ...paymentTransactionData,
              userId: parseInt(userId),
              membershipId: membership.id
            }
          });
        }
      }
    });
  }
}
module.exports = PrismaUserRepository;
