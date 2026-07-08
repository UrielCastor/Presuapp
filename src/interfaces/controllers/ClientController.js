const ClientUseCases = require('../../application/use-cases/ClientUseCases');
const PrismaClientRepository = require('../../infrastructure/repositories/PrismaClientRepository');
const { formatResponse } = require('../../utils/response');

const clientUseCases = new ClientUseCases(new PrismaClientRepository());

class ClientController {
  static async createClient(req, res, next) {
    try {
      const data = { ...req.body, userId: req.user.id, userType: req.user.userType };
      const obj = await clientUseCases.createClient(data);
      res.status(201).json(formatResponse(true, obj, 'Created'));
    } catch (e) { next(e); }
  }
  static async getClients(req, res, next) {
    try {
      const list = await clientUseCases.getClients(req.user.id);
      res.status(200).json(formatResponse(true, list));
    } catch (e) { next(e); }
  }
  static async getClient(req, res, next) {
    try {
      const obj = await clientUseCases.getClient(req.params.id, req.user.id);
      res.status(200).json(formatResponse(true, obj));
    } catch (e) { next(e); }
  }
  static async updateClient(req, res, next) {
    try {
      const obj = await clientUseCases.updateClient(req.params.id, req.body, req.user.id);
      res.status(200).json(formatResponse(true, obj));
    } catch (e) { next(e); }
  }
  static async deleteClient(req, res, next) {
    try {
      await clientUseCases.deleteClient(req.params.id, req.user.id);
      res.status(200).json(formatResponse(true, null, 'Deleted'));
    } catch (e) { next(e); }
  }
}
module.exports = ClientController;
