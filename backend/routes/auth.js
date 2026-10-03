const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { isAuthenticated } = require('../middleware/auth');

router.post('/signup', authController.signup);
router.post('/signin', authController.signin);
router.post('/signout', isAuthenticated, authController.signout);
router.get('/me', isAuthenticated, authController.me);

module.exports = router;
