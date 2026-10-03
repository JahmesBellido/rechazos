const express = require('express');
const router = express.Router();
const transportistasController = require('../controllers/transportistasController');
const { isAuthenticated, isAdmin } = require('../middleware/auth');

router.get('/', isAuthenticated, isAdmin, transportistasController.getAll);
router.get('/:id', isAuthenticated, isAdmin, transportistasController.getById);
router.post('/', isAuthenticated, isAdmin, transportistasController.create);
router.put('/:id', isAuthenticated, isAdmin, transportistasController.update);
router.delete('/:id', isAuthenticated, isAdmin, transportistasController.remove);

module.exports = router;
