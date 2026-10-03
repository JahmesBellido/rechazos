const express = require('express');
const router = express.Router();
const documentosController = require('../controllers/documentosController');
const { isAuthenticated, isAdmin } = require('../middleware/auth');

router.get('/', isAuthenticated, isAdmin, documentosController.getAll);
router.get('/:id', isAuthenticated, isAdmin, documentosController.getById);
router.post('/', isAuthenticated, isAdmin, documentosController.create);
router.put('/:id', isAuthenticated, isAdmin, documentosController.update);
router.delete('/:id', isAuthenticated, isAdmin, documentosController.remove);

module.exports = router;
