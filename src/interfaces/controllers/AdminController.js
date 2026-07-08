const AdminUseCases = require('../../application/use-cases/AdminUseCases');
const { formatResponse } = require('../../utils/response');

const adminUseCases = new AdminUseCases();

class AdminController {
  static async getStats(req, res, next) {
    try {
      const stats = await adminUseCases.getDashboardStats();
      res.status(200).json(formatResponse(true, stats, 'Admin statistics loaded'));
    } catch (error) {
      next(error);
    }
  }

  static async getUsers(req, res, next) {
    try {
      const { name, email, profession, city, plan, status, page, limit } = req.query;
      const result = await adminUseCases.getAllUsers({
        name,
        email,
        profession,
        city,
        plan,
        status,
        page,
        limit
      });
      res.status(200).json(formatResponse(true, result, 'Filtered users list loaded'));
    } catch (error) {
      next(error);
    }
  }

  static async updatePlan(req, res, next) {
    try {
      const { userId, plan } = req.body;
      const result = await adminUseCases.updateUserPlan(req.user.id, userId, plan);
      res.status(200).json(formatResponse(true, result, `User promoted/demoted to plan ${plan}`));
    } catch (error) {
      next(error);
    }
  }

  static async updateStatus(req, res, next) {
    try {
      const { userId, status } = req.body;
      const result = await adminUseCases.updateUserStatus(req.user.id, userId, status);
      res.status(200).json(formatResponse(true, result, `User account status changed to ${status}`));
    } catch (error) {
      next(error);
    }
  }

  static async updateRole(req, res, next) {
    try {
      const { userId, role } = req.body;
      const result = await adminUseCases.updateUserRole(req.user.id, userId, role);
      res.status(200).json(formatResponse(true, result, `User permission role updated to ${role}`));
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AdminController;
