const ServiceItemUseCases = require('../../application/use-cases/ServiceItemUseCases');
const PrismaServiceItemRepository = require('../../infrastructure/repositories/PrismaServiceItemRepository');
const PrismaProfessionRepository = require('../../infrastructure/repositories/PrismaProfessionRepository');
const { formatResponse } = require('../../utils/response');

const itemUseCases = new ServiceItemUseCases(
  new PrismaServiceItemRepository(),
  new PrismaProfessionRepository()
);

class ServiceItemController {
  static async createItem(req, res, next) {
    try {
      const obj = await itemUseCases.createItem(req.body, req.user.id, req.user.userType);
      res.status(201).json(formatResponse(true, obj, 'Created'));
    } catch (e) { next(e); }
  }
  static async getItems(req, res, next) {
    try {
      const list = await itemUseCases.getItems(req.user.id);
      res.status(200).json(formatResponse(true, list));
    } catch (e) { next(e); }
  }
  static async getItemsByProfession(req, res, next) {
    try {
      const list = await itemUseCases.getItemsByProfession(req.params.professionId, req.user.id);
      res.status(200).json(formatResponse(true, list));
    } catch (e) { next(e); }
  }
  static async updateItem(req, res, next) {
    try {
      const obj = await itemUseCases.updateItem(req.params.id, req.body, req.user.id);
      res.status(200).json(formatResponse(true, obj));
    } catch (e) { next(e); }
  }
  static async deleteItem(req, res, next) {
    try {
      await itemUseCases.deleteItem(req.params.id, req.user.id);
      res.status(200).json(formatResponse(true, null, 'Deleted'));
    } catch (e) { next(e); }
  }
}
module.exports = ServiceItemController;
