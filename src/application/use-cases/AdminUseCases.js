const prisma = require('../../infrastructure/database/prisma');

class AdminUseCases {
  async getDashboardStats() {
    const now = new Date();
    
    // Rango Inicio del Día
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Rango Inicio del Mes
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // 1. Ejecutar las consultas de base de datos en paralelo
    const [
      totalUsers,
      activeUsers,
      freeUsers,
      vipUsers,
      usersThisMonth,
      usersToday,
      activeMemberships,
      expiredMemberships,
      nextVencimientos,
      renewals,
      cancellations,
      approvedTransactions,
      pendingTransactions,
      rejectedTransactions,
      totalProfessions,
      totalServices,
      totalClients,
      totalBudgets,
      professionsGroup,
      citiesGroup
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { status: 'ACTIVE' } }),
      prisma.user.count({ where: { userType: 'FREE' } }),
      prisma.user.count({ where: { userType: 'VIP' } }),
      prisma.user.count({ where: { createdAt: { gte: startOfMonth } } }),
      prisma.user.count({ where: { createdAt: { gte: startOfToday } } }),
      prisma.membership.count({
        where: { status: 'ACTIVE', endDate: { gte: now } }
      }),
      prisma.membership.count({
        where: {
          OR: [
            { status: 'INACTIVE' },
            { endDate: { lt: now } }
          ]
        }
      }),
      prisma.membership.count({
        where: {
          status: 'ACTIVE',
          endDate: {
            gte: now,
            lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) // Próximos 7 días
          }
        }
      }),
      prisma.membership.count({ where: { autoRenew: true } }),
      prisma.membership.count({ where: { autoRenew: false } }),
      prisma.paymentTransaction.findMany({
        where: { status: 'approved' }
      }),
      prisma.paymentTransaction.findMany({
        where: { status: 'pending' }
      }),
      prisma.paymentTransaction.findMany({
        where: { status: { in: ['rejected', 'cancelled', 'failure'] } }
      }),
      prisma.profession.count(),
      prisma.serviceItem.count(),
      prisma.client.count(),
      prisma.budget.count(),
      prisma.profession.groupBy({
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
      }),
      prisma.user.groupBy({
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
      })
    ]);

    const popularProfessions = professionsGroup.map(item => ({
      name: item.name,
      count: item._count.id
    }));

    const popularCities = citiesGroup.map(item => ({
      city: item.city,
      count: item._count.id
    }));

    const totalRevenue = approvedTransactions.reduce((sum, tx) => sum + tx.amount, 0);
    const approvedPaymentsCount = approvedTransactions.length;
    const pendingPaymentsCount = pendingTransactions.length;
    const rejectedPaymentsCount = rejectedTransactions.length;

    // Ingresos del mes
    const monthlyTransactions = approvedTransactions.filter(tx => new Date(tx.approvedAt || tx.createdAt) >= startOfMonth);
    const monthlyRevenue = monthlyTransactions.reduce((sum, tx) => sum + tx.amount, 0);

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
        monthlyRevenue: monthlyRevenue,
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

  async getMembershipsList(filters) {
    const { name, email, filterType, page = 1, limit = 50 } = filters;
    const skip = (page - 1) * limit;
    const now = new Date();

    const where = {};

    if (name || email) {
      where.user = {};
      if (name) {
        where.user.name = { contains: name, mode: 'insensitive' };
      }
      if (email) {
        where.user.email = { contains: email, mode: 'insensitive' };
      }
    }

    if (filterType === 'ACTIVE') {
      where.status = 'ACTIVE';
      where.endDate = { gte: now };
    } else if (filterType === 'EXPIRING') {
      where.status = 'ACTIVE';
      where.endDate = { gte: now, lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) };
    } else if (filterType === 'EXPIRED') {
      where.OR = [
        { status: 'INACTIVE' },
        { endDate: { lt: now } }
      ];
    } else if (filterType === 'FREE') {
      where.OR = [
        { status: 'INACTIVE' },
        { planType: 'FREE' }
      ];
    }

    const total = await prisma.membership.count({ where });
    const memberships = await prisma.membership.findMany({
      where,
      include: {
        user: {
          include: {
            paymentTransactions: {
              orderBy: { createdAt: 'desc' },
              take: 1
            }
          }
        }
      },
      orderBy: { endDate: 'desc' },
      skip: parseInt(skip),
      take: parseInt(limit)
    });

    const mapped = memberships.map(m => {
      const daysRemaining = Math.max(0, Math.ceil((new Date(m.endDate) - now) / (1000 * 60 * 60 * 24)));
      const lastPayment = m.user.paymentTransactions[0] || null;
      return {
        id: m.id,
        userId: m.userId,
        userName: m.user.name,
        userEmail: m.user.email,
        planType: m.planType,
        status: m.status === 'ACTIVE' && new Date(m.endDate) >= now ? 'ACTIVE' : 'EXPIRED',
        startDate: m.startDate,
        endDate: m.endDate,
        daysRemaining: m.status === 'ACTIVE' && new Date(m.endDate) >= now ? daysRemaining : 0,
        lastPaymentAmount: lastPayment ? lastPayment.amount : null,
        lastPaymentStatus: lastPayment ? lastPayment.status : null,
        lastPaymentDate: lastPayment ? lastPayment.approvedAt || lastPayment.createdAt : null
      };
    });

    if (filterType === 'FREE' || !filterType) {
      const freeUsers = await prisma.user.findMany({
        where: {
          userType: 'FREE',
          membership: null,
          name: name ? { contains: name, mode: 'insensitive' } : undefined,
          email: email ? { contains: email, mode: 'insensitive' } : undefined,
        },
        skip: Math.max(0, parseInt(skip) - total),
        take: parseInt(limit)
      });

      freeUsers.forEach(u => {
        if (mapped.length < limit) {
          mapped.push({
            id: null,
            userId: u.id,
            userName: u.name,
            userEmail: u.email,
            planType: 'FREE',
            status: 'FREE',
            startDate: u.createdAt,
            endDate: null,
            daysRemaining: 0,
            lastPaymentAmount: null,
            lastPaymentStatus: null,
            lastPaymentDate: null
          });
        }
      });
    }

    return {
      memberships: mapped,
      pagination: {
        total: total + (filterType === 'FREE' || !filterType ? await prisma.user.count({ where: { userType: 'FREE', membership: null } }) : 0),
        page: parseInt(page),
        limit: parseInt(limit),
      }
    };
  }

  async getMembershipDetail(userId) {
    const id = parseInt(userId);
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        membership: true,
        professions: true,
        paymentTransactions: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!user) throw new Error('Usuario no encontrado');

    const now = new Date();
    let daysRemaining = 0;
    if (user.membership && user.membership.status === 'ACTIVE' && new Date(user.membership.endDate) >= now) {
      daysRemaining = Math.ceil((new Date(user.membership.endDate) - now) / (1000 * 60 * 60 * 24));
    }

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        professions: user.professions.map(p => p.name)
      },
      plan: user.membership ? {
        planType: user.membership.planType,
        status: user.membership.status === 'ACTIVE' && new Date(user.membership.endDate) >= now ? 'ACTIVE' : 'EXPIRED',
        startDate: user.membership.startDate,
        endDate: user.membership.endDate,
        daysRemaining
      } : {
        planType: 'FREE',
        status: 'FREE',
        startDate: user.createdAt,
        endDate: null,
        daysRemaining: 0
      },
      payments: user.paymentTransactions.map(p => ({
        id: p.id,
        amount: p.amount,
        createdAt: p.createdAt,
        status: p.status,
        mercadoPagoPaymentId: p.mercadoPagoPaymentId,
        paymentMethod: p.paymentMethod
      }))
    };
  }

  async manuallyActivateVip(adminId, targetUserId) {
    const userId = parseInt(targetUserId);
    const now = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { userType: 'VIP' }
      }),
      prisma.membership.upsert({
        where: { userId },
        update: {
          startDate: now,
          endDate,
          status: 'ACTIVE',
          planType: 'VIP'
        },
        create: {
          userId,
          startDate: now,
          endDate,
          status: 'ACTIVE',
          planType: 'VIP'
        }
      })
    ]);
    return { success: true };
  }

  async manuallyDeactivateVip(adminId, targetUserId) {
    const userId = parseInt(targetUserId);
    const now = new Date();
    
    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { userType: 'FREE' }
      }),
      prisma.membership.upsert({
        where: { userId },
        update: {
          status: 'INACTIVE',
          planType: 'FREE',
          endDate: now
        },
        create: {
          userId,
          startDate: now,
          endDate: now,
          status: 'INACTIVE',
          planType: 'FREE'
        }
      })
    ]);
    return { success: true };
  }

  async manuallyExtendMembership(adminId, targetUserId, days = 30) {
    const userId = parseInt(targetUserId);
    const membership = await prisma.membership.findUnique({
      where: { userId }
    });

    let newEndDate = new Date();
    if (membership && new Date(membership.endDate) > new Date()) {
      newEndDate = new Date(membership.endDate);
    }
    newEndDate.setDate(newEndDate.getDate() + parseInt(days));

    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { userType: 'VIP' }
      }),
      prisma.membership.upsert({
        where: { userId },
        update: {
          endDate: newEndDate,
          status: 'ACTIVE',
          planType: 'VIP'
        },
        create: {
          userId,
          startDate: new Date(),
          endDate: newEndDate,
          status: 'ACTIVE',
          planType: 'VIP'
        }
      })
    ]);
    return { success: true };
  }

  // ==========================================
  // MEMBERSHIP PLAN CONFIG
  // ==========================================

  async getMembershipPlan() {
    let plan = await prisma.membershipPlan.findFirst({ orderBy: { id: 'asc' } });

    // Seed: si no existe, crear el plan por defecto
    if (!plan) {
      plan = await prisma.membershipPlan.create({
        data: {
          name: 'VIP',
          price: 10000,
          currency: 'ARS',
          durationDays: 30,
          active: true
        }
      });
    }

    return plan;
  }

  async updateMembershipPlan(adminUserId, adminName, updates) {
    const plan = await this.getMembershipPlan();
    const changes = [];

    // Validaciones
    if (updates.price !== undefined) {
      const price = parseFloat(updates.price);
      if (isNaN(price) || price <= 0) throw new Error('El precio debe ser un número mayor a 0.');
      if (price !== plan.price) {
        changes.push({ field: 'price', prev: String(plan.price), next: String(price) });
      }
      updates.price = price;
    }

    if (updates.durationDays !== undefined) {
      const days = parseInt(updates.durationDays);
      if (isNaN(days) || days <= 0) throw new Error('La duración debe ser un número entero mayor a 0.');
      if (days !== plan.durationDays) {
        changes.push({ field: 'durationDays', prev: String(plan.durationDays), next: String(days) });
      }
      updates.durationDays = days;
    }

    if (updates.name !== undefined && updates.name !== plan.name) {
      if (!updates.name.trim()) throw new Error('El nombre del plan no puede estar vacío.');
      changes.push({ field: 'name', prev: plan.name, next: updates.name.trim() });
      updates.name = updates.name.trim();
    }

    if (updates.active !== undefined && updates.active !== plan.active) {
      changes.push({ field: 'active', prev: String(plan.active), next: String(updates.active) });
    }

    if (updates.currency !== undefined && updates.currency !== plan.currency) {
      changes.push({ field: 'currency', prev: plan.currency, next: updates.currency });
    }

    if (changes.length === 0) {
      return { plan, message: 'No se detectaron cambios.' };
    }

    // Transacción: actualizar plan + registrar logs
    const logData = changes.map(c => ({
      planId: plan.id,
      adminUserId,
      adminName,
      fieldChanged: c.field,
      previousValue: c.prev,
      newValue: c.next
    }));

    const updateData = {};
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.price !== undefined) updateData.price = updates.price;
    if (updates.currency !== undefined) updateData.currency = updates.currency;
    if (updates.durationDays !== undefined) updateData.durationDays = updates.durationDays;
    if (updates.active !== undefined) updateData.active = updates.active;

    await prisma.$transaction([
      prisma.membershipPlan.update({ where: { id: plan.id }, data: updateData }),
      prisma.planChangeLog.createMany({ data: logData })
    ]);

    const updated = await prisma.membershipPlan.findUnique({ where: { id: plan.id } });
    return { plan: updated, changesApplied: changes.length };
  }

  async getPlanChangeLogs(limit = 20) {
    const logs = await prisma.planChangeLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: { plan: { select: { name: true } } }
    });
    return logs;
  }
}

module.exports = AdminUseCases;
