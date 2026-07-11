const ClientRepository = require('../../domain/repositories/ClientRepository');
const prisma = require('../database/prisma');
const Client = require('../../domain/entities/Client');

class PrismaClientRepository extends ClientRepository {
  async create(data) {
    const c = await prisma.client.create({ data });
    return new Client(c);
  }
  async findAllByUserId(userId) {
    const cs = await prisma.client.findMany({ where: { userId: parseInt(userId) } });
    return cs.map(c => new Client(c));
  }
  async findById(id) {
    const c = await prisma.client.findUnique({ where: { id: parseInt(id) } });
    if (!c) return null;
    return new Client(c);
  }
  async update(id, data) {
    try {
      const c = await prisma.client.update({ where: { id: parseInt(id) }, data });
      return new Client(c);
    } catch { return null; }
  }
  async delete(id) {
    const budgetsCount = await prisma.budget.count({
      where: { clientId: parseInt(id) }
    });
    if (budgetsCount > 0) {
      throw new Error(`No es posible eliminar al cliente porque posee presupuestos asociados. Para mantener la consistencia histórica de la base de datos, debés eliminar primero todos sus presupuestos asociados.`);
    }

    try { await prisma.client.delete({ where: { id: parseInt(id) } }); } catch {}
  }
}
module.exports = PrismaClientRepository;
