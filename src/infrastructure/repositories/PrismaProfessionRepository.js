const ProfessionRepository = require('../../domain/repositories/ProfessionRepository');
const prisma = require('../database/prisma');
const Profession = require('../../domain/entities/Profession');

class PrismaProfessionRepository extends ProfessionRepository {
  async create(data) {
    const p = await prisma.profession.create({ data });
    return new Profession(p);
  }
  async findAllByUserId(userId) {
    const ps = await prisma.profession.findMany({ where: { userId: parseInt(userId) } });
    return ps.map(p => new Profession(p));
  }
  async findById(id) {
    const p = await prisma.profession.findUnique({ where: { id: parseInt(id) } });
    if (!p) return null;
    return new Profession(p);
  }
  async update(id, data) {
    try {
      const p = await prisma.profession.update({ where: { id: parseInt(id) }, data });
      return new Profession(p);
    } catch {
      return null;
    }
  }
  async delete(id) {
    try {
      await prisma.profession.delete({ where: { id: parseInt(id) } });
    } catch {}
  }
}
module.exports = PrismaProfessionRepository;
