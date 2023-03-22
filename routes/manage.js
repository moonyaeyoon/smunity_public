const express = require('express');
const { verifyAToken } = require('../middlewares');
const { getCertificateList, basic, addCertificate, updateMajorInCertificate } = require('../services/manage/certificate');

const router = express.Router();

router.get('/certificate/list', getCertificateList);
router.post('/certificate/create', verifyAToken, addCertificate);
router.put('/certificate/update', updateMajorInCertificate);
module.exports = router;
