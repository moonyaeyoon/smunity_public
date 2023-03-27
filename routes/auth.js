const express = require('express');

const { verifyAToken } = require('../middlewares');

const { checkSchoolId, join, login, refreshAToken, getUserMajors, getUserInfo } = require('../services/auth/auth');

const router = express.Router();

router.get('/check_school_id', checkSchoolId);

router.post('/join', join);

router.get('/login', login);

router.get('/refresh_access_token', refreshAToken);

router.get('/usermajors', verifyAToken, getUserMajors);

router.get('/user_info', verifyAToken, getUserInfo);

module.exports = router;
