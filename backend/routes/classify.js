const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { uploadSingle } = require('../middleware/upload');
const { classifyWaste } = require('../controllers/classifyController');

router.post('/', auth, uploadSingle('image'), classifyWaste);

module.exports = router;
