const express = require('express');
const router = express.Router();
const imageUploader = require('../services/image/ImageUploader'); // 이미지 업로드 미들웨어 모듈

router.post('/', imageUploader.single('image'), (req, res) => {
    if (!req.file) {
        res.status(400).json({ message: 'No file uploaded' });
        return;
    }

    const imageUrl = req.file.location;
    res.json({ imageUrl });
});

module.exports = router;
