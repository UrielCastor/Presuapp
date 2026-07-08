const ProfessionalUseCases = require('../../application/use-cases/ProfessionalUseCases');
const PrismaUserRepository = require('../../infrastructure/repositories/PrismaUserRepository');
const { formatResponse } = require('../../utils/response');

const professionalUseCases = new ProfessionalUseCases(new PrismaUserRepository());

class ProfessionalController {
  static async searchProfessionals(req, res, next) {
    try {
      const { q } = req.query;
      const list = await professionalUseCases.search(q);
      res.status(200).json(formatResponse(true, list));
    } catch (e) {
      next(e);
    }
  }
}

module.exports = ProfessionalController;
