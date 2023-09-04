const express = require('express');

const { verifyAToken, trackEvent} = require('../middlewares');

const {
    checkSchoolId,
    join,
    login,
    refreshAToken,
    getUserMajors,
    addSchoolAuth,
    getUserInfo,
    editUserNickName,
    editUserProfileImage,
    deleteUser,
    changePassword,
    sendUserAuthLinkForTest,
    getMyActivity,
    checkUserPassword,
    findPassword,
    editUserMbti,
    editUserTimeTable,
} = require('../services/auth/auth');

const router = express.Router();

router.get('/check_school_id', checkSchoolId);

router.post('/join', trackEvent, join);

router.post('/login', trackEvent, login);

router.delete('/revoke', verifyAToken, trackEvent, deleteUser);

router.get('/refresh_access_token', refreshAToken);

router.get('/usermajors', verifyAToken, getUserMajors);

router.get('/user_info', verifyAToken, getUserInfo);

router.get('/auth_email', trackEvent, addSchoolAuth);

router.put('/user/nickname', verifyAToken, trackEvent, editUserNickName);

router.put('/user/profile_image', verifyAToken, trackEvent, editUserProfileImage);

router.put('/edit/mbti', verifyAToken, trackEvent, editUserMbti);

router.put('/edit/timetable', verifyAToken, trackEvent, editUserTimeTable);

router.put('/user/password', verifyAToken, trackEvent, changePassword);

router.get('/rhksflwkdlapdlffldzmcpzmapi', sendUserAuthLinkForTest); //관리자이메일링크체크api

router.get('/my_activity', verifyAToken, getMyActivity);

router.post('/check_password', verifyAToken, checkUserPassword);

router.post('/find_password', findPassword);

module.exports = router;
