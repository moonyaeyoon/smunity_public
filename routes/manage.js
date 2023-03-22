const express = require('express');
const { verifyAToken } = require('../middlewares');
const {
    getCertificateList,
    basic,
    addCertificate,
    updateMajorInCertificate,
    getCertificateInfo,
    deletePostMajor,
} = require('../services/manage/certificate');

const router = express.Router();

router.get('/certificate/list', getCertificateList);
router.post('/certificate/create', verifyAToken, addCertificate);
router.put('/certificate/update', updateMajorInCertificate);
router.post('/certificate/postInfo', getCertificateInfo);
router.post('/certificate/deletePost', deletePostMajor);
module.exports = router;
