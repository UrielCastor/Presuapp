const BudgetUseCases = require('../../application/use-cases/BudgetUseCases');
const PrismaBudgetRepository = require('../../infrastructure/repositories/PrismaBudgetRepository');
const PrismaClientRepository = require('../../infrastructure/repositories/PrismaClientRepository');
const PrismaServiceItemRepository = require('../../infrastructure/repositories/PrismaServiceItemRepository');
const { formatResponse } = require('../../utils/response');

const budgetUseCases = new BudgetUseCases(
  new PrismaBudgetRepository(),
  new PrismaClientRepository(),
  new PrismaServiceItemRepository()
);

class BudgetController {
  static async createBudget(req, res, next) {
    try {
      const data = { ...req.body, userId: req.user.id, userType: req.user.userType };
      const obj = await budgetUseCases.createBudget(data);
      res.status(201).json(formatResponse(true, obj, 'Created'));
    } catch (e) { next(e); }
  }
  static async getBudgets(req, res, next) {
    try {
      const list = await budgetUseCases.getBudgets(req.user.id);
      res.status(200).json(formatResponse(true, list));
    } catch (e) { next(e); }
  }
  static async getBudget(req, res, next) {
    try {
      const obj = await budgetUseCases.getBudget(req.params.id, req.user.id);
      res.status(200).json(formatResponse(true, obj));
    } catch (e) { next(e); }
  }
  static async updateBudget(req, res, next) {
    try {
      const obj = await budgetUseCases.updateBudget(req.params.id, req.body, req.user.id);
      res.status(200).json(formatResponse(true, obj));
    } catch (e) { next(e); }
  }
  static async deleteBudget(req, res, next) {
    try {
      await budgetUseCases.deleteBudget(req.params.id, req.user.id);
      res.status(200).json(formatResponse(true, null, 'Deleted'));
    } catch (e) { next(e); }
  }
  static async getWhatsappLink(req, res, next) {
    try {
      const link = await budgetUseCases.generateWhatsappLink(req.params.id, req.user.id);
      res.status(200).json(formatResponse(true, { link }));
    } catch (e) { next(e); }
  }

  static async getPdf(req, res, next) {
    try {
      const pdfStream = await budgetUseCases.generatePdf(req.params.id, req.user.id);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=Presupuesto_${req.params.id}.pdf`);
      pdfStream.pipe(res);
    } catch (e) {
      next(e);
    }
  }
}
module.exports = BudgetController;
