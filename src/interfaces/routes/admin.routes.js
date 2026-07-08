const { Router } = require('express');
const AdminController = require('../controllers/AdminController');
const { protectAdminRoute } = require('../middlewares/admin.middleware');

const router = Router();

router.get('/stats', protectAdminRoute, AdminController.getStats);
router.get('/users', protectAdminRoute, AdminController.getUsers);
router.post('/users/plan', protectAdminRoute, AdminController.updatePlan);
router.post('/users/status', protectAdminRoute, AdminController.updateStatus);
router.post('/users/role', protectAdminRoute, AdminController.updateRole);

module.exports = router;
