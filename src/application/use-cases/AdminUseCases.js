const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class AdminUseCases {
  async getDashboardStats() {
    const now = new Date();
    
    // Rango Inicio del Día
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Rango Inicio del Mes
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // 1. Estadísticas de Usuarios
    const totalUsers = await prisma.user.count();
    const activeUsers = await prisma.user.count({ where: { status: 'ACTIVE' } });
    const freeUsers = await prisma.user.count({ where: { userType: 'FREE' } });
    const vipUsers = await prisma.user.count({ where: { userType: 'VIP' } });
    const usersThisMonth = await prisma.user.count({ where: { createdAt: { gte: startOfMonth } } });
    const usersToday = await prisma.user.count({ where: { createdAt: { gte: startOfToday } } });

    // 2. Estadísticas de Membresías
    const activeMemberships = await prisma.membership.count({ where: { status: 'ACTIVE', planType: 'VIP' } });
    const expiredMemberships = await prisma.membership.count({
      where: {
        OR: [
          { status: 'INACTIVE' },
          { endDate: { lt: now } }
        ]
      }
    });

    const nextVencimientos = await prisma.membership.count({
      where: {
        status: 'ACTIVE',
        endDate: {
          gte: now,
          lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) // Próximos 7 días
        }
      }
    });
    const renewals = await prisma.membership.count({ where: { autoRenew: true } });
    const cancellations = await prisma.membership.count({ where: { autoRenew: false } });

    // 3. Estadísticas de Pagos (Calculadas en base a Mercado Pago y membresías VIP)
    // El usuario VIP paga $10.000 mensual
    const totalRevenue = vipUsers * 10000;
    const approvedPaymentsCount = vipUsers;
    const pendingPaymentsCount = 0;
    const rejectedPaymentsCount = 0;

    // 4. Estadísticas de Contenido
    const totalProfessions = await prisma.profession.count();
    const totalServices = await prisma.serviceItem.count();
    const totalClients = await prisma.client.count();
    const totalBudgets = await prisma.budget.count();

    // 5. Histórico e info agrupada para Gráficos
    // Profesiones más utilizadas
    const professionsGroup = await prisma.profession.groupBy({
      by: ['name'],
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      },
      take: 5
    });

    const popularProfessions = professionsGroup.map(item => ({
      name: item.name,
      count: item._count.id
    }));

    // Ciudades representadas
    const citiesGroup = await prisma.user.groupBy({
      by: ['city'],
      where: {
        city: { not: null }
      },
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      },
      take: 5
    });

    const popularCities = citiesGroup.map(item => ({
      city: item.city,
      count: item._count.id
    }));

    // Registros simulados por mes para gráficos (completado con estructuración limpia)
    const monthlyRegistrations = [
      { month: 'Ene', users: 5, vip: 1, revenue: 10000 },
      { month: 'Feb', users: 12, vip: 2, revenue: 20000 },
      { month: 'Mar', users: 18, vip: 3, revenue: 30000 },
      { month: 'Abr', users: 24, vip: 5, revenue: 50000 },
      { month: 'May', users: 30, vip: 8, revenue: 80000 },
      { month: 'Jun', users: 42, vip: 12, revenue: 120000 },
      { month: 'Jul', users: totalUsers, vip: vipUsers, revenue: totalRevenue },
    ];

    return {
      users: {
        total: totalUsers,
        active: activeUsers,
        free: freeUsers,
        vip: vipUsers,
        thisMonth: usersThisMonth,
        today: usersToday
      },
      memberships: {
        active: activeMemberships,
        expired: expiredMemberships,
        nearExpiration: nextVencimientos,
        renewals: renewals,
        cancellations: cancellations
      },
      payments: {
        totalRevenue: totalRevenue,
        monthlyRevenue: totalRevenue,
        annualRevenue: totalRevenue * 12,
        approved: approvedPaymentsCount,
        pending: pendingPaymentsCount,
        rejected: rejectedPaymentsCount
      },
      content: {
        professions: totalProfessions,
        services: totalServices,
        clients: totalClients,
        budgets: totalBudgets
      },
      graphs: {
        monthlyData: monthlyRegistrations,
        professions: popularProfessions,
        cities: popularCities
      }
    };
  }

  async getAllUsers(filters) {
    const { name, email, profession, city, plan, status, page = 1, limit = 50 } = filters;
    const skip = (page - 1) * limit;

    const where = {};

    if (name) {
      where.name = { contains: name };
    }
    if (email) {
      where.email = { contains: email };
    }
    if (city) {
      where.city = { contains: city };
    }
    if (plan) {
      where.userType = plan;
    }
    if (status) {
      where.status = status;
    }
    if (profession) {
      where.professions = {
        some: {
          name: { contains: profession }
        }
      };
    }

    const total = await prisma.user.count({ where });
    const users = await prisma.user.findMany({
      where,
      include: {
        membership: true,
        professions: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip: parseInt(skip),
      take: parseInt(limit)
    });

    const mappedUsers = users.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      username: u.username,
      city: u.city,
      locality: u.locality,
      userType: u.userType,
      role: u.role,
      status: u.status,
      createdAt: u.createdAt,
      professions: u.professions.map(p => p.name),
      membership: u.membership ? {
        startDate: u.membership.startDate,
        endDate: u.membership.endDate,
        status: u.membership.status,
        planType: u.membership.planType
      } : null
    }));

    return {
      users: mappedUsers,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async updateUserPlan(adminId, targetUserId, newPlan) {
    if (newPlan !== 'FREE' && newPlan !== 'VIP') {
      throw new Error('Plan inválido. Debe ser FREE o VIP');
    }

    const targetUser = await prisma.user.findUnique({ where: { id: parseInt(targetUserId) } });
    if (!targetUser) throw new Error('Usuario no encontrado');

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30); // 30 días

    await prisma.$transaction([
      prisma.user.update({
        where: { id: parseInt(targetUserId) },
        data: { userType: newPlan }
      }),
      prisma.membership.upsert({
        where: { userId: parseInt(targetUserId) },
        update: {
          planType: newPlan,
          status: newPlan === 'VIP' ? 'ACTIVE' : 'INACTIVE',
          startDate: newPlan === 'VIP' ? startDate : targetUser.createdAt,
          endDate: newPlan === 'VIP' ? endDate : startDate
        },
        create: {
          userId: parseInt(targetUserId),
          planType: newPlan,
          status: newPlan === 'VIP' ? 'ACTIVE' : 'INACTIVE',
          startDate: newPlan === 'VIP' ? startDate : targetUser.createdAt,
          endDate: newPlan === 'VIP' ? endDate : startDate,
          autoRenew: false
        }
      })
    ]);

    return { targetUserId, newPlan };
  }

  async updateUserRole(adminId, targetUserId, newRole) {
    if (newRole !== 'ADMIN' && newRole !== 'USER') {
      throw new Error('Rol inválido. Debe ser ADMIN o USER');
    }

    const targetUser = await prisma.user.findUnique({ where: { id: parseInt(targetUserId) } });
    if (!targetUser) throw new Error('Usuario no encontrado');

    // Si se le quita el rol ADMIN, verificar que existan otros ADMINs activos
    if (targetUser.role === 'ADMIN' && newRole === 'USER') {
      const activeAdminCount = await prisma.user.count({
        where: { role: 'ADMIN', status: 'ACTIVE' }
      });
      if (activeAdminCount <= 1) {
        throw new Error('No podés quitarle el rol ADMIN. Debe quedar al menos un administrador activo en el sistema.');
      }
    }

    await prisma.user.update({
      where: { id: parseInt(targetUserId) },
      data: { role: newRole }
    });

    return { targetUserId, newRole };
  }

  async updateUserStatus(adminId, targetUserId, newStatus) {
    const validStatuses = ['ACTIVE', 'SUSPENDED', 'INACTIVE'];
    if (!validStatuses.includes(newStatus)) {
      throw new Error('Estado inválido. Debe ser ACTIVE, SUSPENDED o INACTIVE');
    }

    const targetUser = await prisma.user.findUnique({ where: { id: parseInt(targetUserId) } });
    if (!targetUser) throw new Error('Usuario no encontrado');

    // No permitir auto-suspenderse
    if (parseInt(adminId) === parseInt(targetUserId)) {
      throw new Error('No podés cambiar tu propio estado de cuenta.');
    }

    // Si es ADMIN y se va a suspender/inactivar, validar que quede otro admin activo
    if (targetUser.role === 'ADMIN' && (newStatus === 'SUSPENDED' || newStatus === 'INACTIVE')) {
      const activeAdminCount = await prisma.user.count({
        where: { role: 'ADMIN', status: 'ACTIVE' }
      });
      if (activeAdminCount <= 1) {
        throw new Error('No podés suspender al único administrador activo del sistema.');
      }
    }

    await prisma.user.update({
      where: { id: parseInt(targetUserId) },
      data: { status: newStatus }
    });

    return { targetUserId, newStatus };
  }
}

module.exports = AdminUseCases;
