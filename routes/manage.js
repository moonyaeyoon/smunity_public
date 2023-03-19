const express = require('express');
const { verifyAToken } = require('../middlewares');
const { getCertificateList, basic, addCertificate } = require('../services/manage/certificate');

const router = express.Router();

router.get('/certificate/list', getCertificateList);
router.post('/certificate/create', verifyAToken, addCertificate);
module.exports = router;
