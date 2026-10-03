const express = require('express');
const router = express.Router();
const usersController = require('../controllers/usersController');
const { isAuthenticated, isAdmin } = require('../middleware/auth');

router.get('/', isAuthenticated, isAdmin, usersController.getAll);
router.get('/:id', isAuthenticated, isAdmin, usersController.getById);
router.post('/', isAuthenticated, isAdmin, usersController.create);
router.put('/:id', isAuthenticated, isAdmin, usersController.update);
router.patch('/:id/status', isAuthenticated, isAdmin, usersController.toggleStatus);
router.delete('/:id', isAuthenticated, isAdmin, usersController.remove);

module.exports = router;
