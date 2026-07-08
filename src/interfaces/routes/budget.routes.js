const { Router } = require('express');
const BudgetController = require('../controllers/BudgetController');
const { protectRoute } = require('../middlewares/auth.middleware');

const router = Router();

router.post('/', protectRoute, BudgetController.createBudget);
router.get('/', protectRoute, BudgetController.getBudgets);
router.get('/:id', protectRoute, BudgetController.getBudget);
router.put('/:id', protectRoute, BudgetController.updateBudget);
router.delete('/:id', protectRoute, BudgetController.deleteBudget);
router.get('/:id/whatsapp', protectRoute, BudgetController.getWhatsappLink);
router.get('/:id/pdf', protectRoute, BudgetController.getPdf);

module.exports = router;
