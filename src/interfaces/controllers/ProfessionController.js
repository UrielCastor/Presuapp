const ProfessionUseCases = require('../../application/use-cases/ProfessionUseCases');
const PrismaProfessionRepository = require('../../infrastructure/repositories/PrismaProfessionRepository');
const { formatResponse } = require('../../utils/response');

const professionUseCases = new ProfessionUseCases(new PrismaProfessionRepository());

class ProfessionController {
  static async createProfession(req, res, next) {
    try {
      const data = { ...req.body, userId: req.user.id, userType: req.user.userType };
      const obj = await professionUseCases.createProfession(data);
      res.status(201).json(formatResponse(true, obj, 'Created'));
    } catch (e) { next(e); }
  }
  static async getProfessions(req, res, next) {
    try {
      const list = await professionUseCases.getProfessions(req.user.id);
      res.status(200).json(formatResponse(true, list));
    } catch (e) { next(e); }
  }
  static async updateProfession(req, res, next) {
    try {
      const obj = await professionUseCases.updateProfession(req.params.id, req.body, req.user.id);
      res.status(200).json(formatResponse(true, obj));
    } catch (e) { next(e); }
  }
  static async deleteProfession(req, res, next) {
    try {
      await professionUseCases.deleteProfession(req.params.id, req.user.id);
      res.status(200).json(formatResponse(true, null, 'Deleted'));
    } catch (e) { next(e); }
  }
}
module.exports = ProfessionController;
