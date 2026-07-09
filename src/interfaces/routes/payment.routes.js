const { Router } = require('express');
const PaymentController = require('../controllers/PaymentController');
const { protectRoute } = require('../middlewares/auth.middleware');

const router = Router();

router.post('/create-preference', protectRoute, PaymentController.createPreference);
router.get('/plan', protectRoute, PaymentController.getActivePlan);
router.post('/webhook', PaymentController.webhook);
router.post('/simulate-success', protectRoute, PaymentController.simulateSuccessPayment);

module.exports = router;
