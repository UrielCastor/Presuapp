const { Router } = require('express');
const AdminController = require('../controllers/AdminController');
const { protectAdminRoute } = require('../middlewares/admin.middleware');

const router = Router();

router.get('/stats', protectAdminRoute, AdminController.getStats);
router.get('/users', protectAdminRoute, AdminController.getUsers);
router.post('/users/plan', protectAdminRoute, AdminController.updatePlan);
router.post('/users/status', protectAdminRoute, AdminController.updateStatus);
router.post('/users/role', protectAdminRoute, AdminController.updateRole);

// Membresías admin
router.get('/memberships', protectAdminRoute, AdminController.getMemberships);
router.get('/memberships/:userId', protectAdminRoute, AdminController.getMembershipById);
router.post('/memberships/extend', protectAdminRoute, AdminController.extendMembership);
router.post('/memberships/activate', protectAdminRoute, AdminController.manuallyActivateVip);
router.post('/memberships/deactivate', protectAdminRoute, AdminController.manuallyDeactivateVip);

module.exports = router;
