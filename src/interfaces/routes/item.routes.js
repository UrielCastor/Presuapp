const { Router } = require('express');
const ServiceItemController = require('../controllers/ServiceItemController');
const { protectRoute } = require('../middlewares/auth.middleware');

const router = Router();

router.post('/', protectRoute, ServiceItemController.createItem);
router.get('/', protectRoute, ServiceItemController.getItems);
router.get('/profession/:professionId', protectRoute, ServiceItemController.getItemsByProfession);
router.put('/:id', protectRoute, ServiceItemController.updateItem);
router.delete('/:id', protectRoute, ServiceItemController.deleteItem);

module.exports = router;
