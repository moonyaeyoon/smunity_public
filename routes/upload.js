const express = require('express');
const router = express.Router();
const { imageUploader } = require('../services/image/ImageUploader'); // 이미지 업로드 미들웨어 모듈
const RES_ERROR_JSON = require('../constants/resErrorJson');

router.post('/', imageUploader.array('image'), (req, res) => {
    if (!req.files) {
        return res.status(RES_ERROR_JSON.NO_IMAGE.status_code).json(RES_ERROR_JSON.NO_IMAGE.res_json);
    }

    const imageUrl = req.files.map((file) => file.location);
    const imageUrls = imageUrl.join(',');
    res.json({ imageUrls });
});

module.exports = router;
