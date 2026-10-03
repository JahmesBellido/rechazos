const express = require('express');
const router = express.Router();
const rechazosController = require('../controllers/rechazosController');
const { isAuthenticated, isAdmin } = require('../middleware/auth');

router.get('/', isAuthenticated, rechazosController.getAll);
router.get('/:id', isAuthenticated, rechazosController.getById);
router.post('/', isAuthenticated, isAdmin, rechazosController.create);
router.put('/:id', isAuthenticated, isAdmin, rechazosController.update);
router.delete('/:id', isAuthenticated, isAdmin, rechazosController.remove);

module.exports = router;
