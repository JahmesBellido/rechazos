const express = require('express');
const router = express.Router();
const analisisController = require('../controllers/analisisController');
const { isAuthenticated } = require('../middleware/auth');

router.get('/', isAuthenticated, analisisController.getAll);
router.get('/:id', isAuthenticated, analisisController.getById);
router.post('/', isAuthenticated, analisisController.create);
router.put('/:id', isAuthenticated, analisisController.update);
router.delete('/:id', isAuthenticated, analisisController.remove);

module.exports = router;
