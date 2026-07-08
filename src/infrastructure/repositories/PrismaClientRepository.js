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
    try { await prisma.client.delete({ where: { id: parseInt(id) } }); } catch {}
  }
}
module.exports = PrismaClientRepository;
