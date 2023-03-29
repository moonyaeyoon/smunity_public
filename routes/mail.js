const express = require('express');
const { verifyAToken } = require('../middlewares');
const { mailing } = require('../services/mailing');

const router = express.Router();

router.post('/send', mailing);
module.exports = router;
