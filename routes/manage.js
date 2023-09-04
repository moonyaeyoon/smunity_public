const express = require('express');
const { verifyAToken, trackEvent } = require('../middlewares');
const {
    getCertificateList,
    addCertificate,
    updateMajorInCertificate,
    getCertificateInfo,
    deletePostMajor,
    rejectCertificate,
} = require('../services/manage/certificate');

const router = express.Router();

router.get('/certificate/list', getCertificateList);
router.post('/certificate/create', verifyAToken, trackEvent, addCertificate);
router.put('/certificate/update', updateMajorInCertificate);
router.post('/certificate/postInfo', getCertificateInfo);
router.post('/certificate/deletePost', deletePostMajor);
router.post('/certificate/rejectPost', rejectCertificate);
module.exports = router;
