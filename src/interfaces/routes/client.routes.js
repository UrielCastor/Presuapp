const { Router } = require('express');
const ClientController = require('../controllers/ClientController');
const { protectRoute } = require('../middlewares/auth.middleware');

const router = Router();

router.post('/', protectRoute, ClientController.createClient);
router.get('/', protectRoute, ClientController.getClients);
router.get('/:id', protectRoute, ClientController.getClient);
router.put('/:id', protectRoute, ClientController.updateClient);
router.delete('/:id', protectRoute, ClientController.deleteClient);

module.exports = router;
