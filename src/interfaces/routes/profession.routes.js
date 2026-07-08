const { Router } = require('express');
const ProfessionController = require('../controllers/ProfessionController');
const { protectRoute } = require('../middlewares/auth.middleware');

const router = Router();

router.post('/', protectRoute, ProfessionController.createProfession);
router.get('/', protectRoute, ProfessionController.getProfessions);
router.put('/:id', protectRoute, ProfessionController.updateProfession);
router.delete('/:id', protectRoute, ProfessionController.deleteProfession);

module.exports = router;
