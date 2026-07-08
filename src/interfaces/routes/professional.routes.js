const { Router } = require('express');
const ProfessionalController = require('../controllers/ProfessionalController');

const router = Router();

router.get('/', ProfessionalController.searchProfessionals);

module.exports = router;
