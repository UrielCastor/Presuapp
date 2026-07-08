const BudgetRepository = require('../../domain/repositories/BudgetRepository');
const prisma = require('../database/prisma');
const Budget = require('../../domain/entities/Budget');
const BudgetItem = require('../../domain/entities/BudgetItem');

class PrismaBudgetRepository extends BudgetRepository {
  async create(data) {
    const { items, ...budgetData } = data;

    const budget = await prisma.budget.create({
      data: {
        ...budgetData,
        items: {
          create: items
        }
      },
      include: { items: true, client: true }
    });

    return budget;
  }

  async findAllByUserId(userId) {
    return prisma.budget.findMany({
      where: { userId: parseInt(userId) },
      include: { client: true, items: true }
    });
  }

  async findById(id) {
    const b = await prisma.budget.findUnique({
      where: { id: parseInt(id) },
      include: {
        items: true,
        client: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            createdAt: true
          }
        }
      }
    });

    return b;
  }

  async update(id, data) {
    try {
      return await prisma.budget.update({
        where: { id: parseInt(id) },
        data
      });
    } catch { return null; }
  }

  async delete(id) {
    try { await prisma.budget.delete({ where: { id: parseInt(id) } }); } catch { }
  }

  async countBudgetItemsByUserId(userId) {
    return prisma.budgetItem.count({
      where: {
        budget: {
          userId: parseInt(userId)
        }
      }
    });
  }
}
module.exports = PrismaBudgetRepository;
