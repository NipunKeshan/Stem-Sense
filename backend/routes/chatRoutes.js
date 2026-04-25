const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { chatWithBot } = require('../controllers/chatController');

// POST /api/chat — Send message to chatbot
router.post('/', protect, chatWithBot);

module.exports = router;
