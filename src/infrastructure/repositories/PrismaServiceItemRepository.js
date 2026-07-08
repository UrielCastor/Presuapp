const ServiceItemRepository = require('../../domain/repositories/ServiceItemRepository');
const prisma = require('../database/prisma');
const ServiceItem = require('../../domain/entities/ServiceItem');

class PrismaServiceItemRepository extends ServiceItemRepository {
  async countByProfessionId(professionId) {
    return prisma.serviceItem.count({ where: { professionId: parseInt(professionId) } });
  }

  async create(data) {
    const item = await prisma.serviceItem.create({ data });
    return new ServiceItem(item);
  }

  async findAllByUserId(userId) {
    const items = await prisma.serviceItem.findMany({
      where: { profession: { userId: parseInt(userId) } }
    });
    return items.map(i => new ServiceItem(i));
  }

  async findAllByProfessionId(professionId) {
    const items = await prisma.serviceItem.findMany({
      where: { professionId: parseInt(professionId) }
    });
    return items.map(i => new ServiceItem(i));
  }

  async findById(id) {
    const item = await prisma.serviceItem.findUnique({
      where: { id: parseInt(id) },
      include: { profession: true }
    });
    if (!item) return null;
    return { ...new ServiceItem(item), profession: item.profession };
  }

  async update(id, data) {
    try {
      const item = await prisma.serviceItem.update({ where: { id: parseInt(id) }, data });
      return new ServiceItem(item);
    } catch { return null; }
  }

  async delete(id) {
    try { await prisma.serviceItem.delete({ where: { id: parseInt(id) } }); }
    catch {}
  }
}
module.exports = PrismaServiceItemRepository;
