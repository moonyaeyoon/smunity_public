const express = require('express');

const { verifyAToken } = require('../middlewares');

const {
    checkSchoolId,
    join,
    login,
    refreshAToken,
    getUserMajors,
    addSchoolAuth,
    getUserInfo,
    deleteUser,
} = require('../services/auth/auth');

const imageUploader = require('../services/image/ImageUploader');

const router = express.Router();

router.get('/check_school_id', checkSchoolId);

router.post('/join', imageUploader.single('image'), join);

router.get('/login', login);

router.delete('/withdrawal', verifyAToken, deleteUser);

router.get('/refresh_access_token', refreshAToken);

router.get('/usermajors', verifyAToken, getUserMajors);

router.get('/user_info', verifyAToken, getUserInfo);

router.get('/auth_email', addSchoolAuth);

module.exports = router;
