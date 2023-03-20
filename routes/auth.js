const express = require('express');
const passport = require('passport');

const { verifyAToken } = require('../middlewares');

const { checkSchoolId, join, login, refreshAToken } = require('../services/auth/auth');

const router = express.Router();

router.get('/check_school_id', checkSchoolId);

router.post('/join', join);

router.post('/login', login);

router.get('/refresh_access_token', refreshAToken);

module.exports = router;
