const { Router } = require('express');
const AuthController = require('../controllers/AuthController');
const { protectRoute } = require('../middlewares/auth.middleware');

const router = Router();

router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.get('/me', protectRoute, AuthController.me);

module.exports = router;
