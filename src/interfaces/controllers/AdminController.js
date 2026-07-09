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

  static async getMemberships(req, res, next) {
    try {
      const { name, email, filterType, page, limit } = req.query;
      const result = await adminUseCases.getMembershipsList({
        name,
        email,
        filterType,
        page,
        limit
      });
      res.status(200).json(formatResponse(true, result, 'Membership list loaded'));
    } catch (error) {
      next(error);
    }
  }

  static async getMembershipById(req, res, next) {
    try {
      const { userId } = req.params;
      const result = await adminUseCases.getMembershipDetail(userId);
      res.status(200).json(formatResponse(true, result, 'Membership details loaded'));
    } catch (error) {
      next(error);
    }
  }

  static async extendMembership(req, res, next) {
    try {
      const { userId, days } = req.body;
      const result = await adminUseCases.manuallyExtendMembership(req.user.id, userId, days);
      res.status(200).json(formatResponse(true, result, 'Membresía extendida con éxito'));
    } catch (error) {
      next(error);
    }
  }

  static async manuallyActivateVip(req, res, next) {
    try {
      const { userId } = req.body;
      const result = await adminUseCases.manuallyActivateVip(req.user.id, userId);
      res.status(200).json(formatResponse(true, result, 'VIP activado con éxito'));
    } catch (error) {
      next(error);
    }
  }

  static async manuallyDeactivateVip(req, res, next) {
    try {
      const { userId } = req.body;
      const result = await adminUseCases.manuallyDeactivateVip(req.user.id, userId);
      res.status(200).json(formatResponse(true, result, 'VIP desactivado con éxito'));
    } catch (error) {
      next(error);
    }
  }

  // Plan VIP Config
  static async getPlan(req, res, next) {
    try {
      const plan = await adminUseCases.getMembershipPlan();
      res.status(200).json(formatResponse(true, plan, 'Plan loaded'));
    } catch (error) {
      next(error);
    }
  }

  static async updatePlanConfig(req, res, next) {
    try {
      const { name, price, currency, durationDays, active } = req.body;
      const result = await adminUseCases.updateMembershipPlan(
        req.user.id,
        req.user.name || req.user.email,
        { name, price, currency, durationDays, active }
      );
      res.status(200).json(formatResponse(true, result, 'Plan actualizado con éxito'));
    } catch (error) {
      next(error);
    }
  }

  static async getPlanChangeLogs(req, res, next) {
    try {
      const logs = await adminUseCases.getPlanChangeLogs();
      res.status(200).json(formatResponse(true, logs, 'Change logs loaded'));
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AdminController;
