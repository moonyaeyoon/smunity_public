const express = require('express');
const router = express.Router();
const { profileImageUploader, postImageUploader, timetableImageUploader, imageRemover, getEmoticon } = require('../services/image/ImageUploader'); // 이미지 업로드 미들웨어 모듈
const RES_ERROR_JSON = require('../constants/resErrorJson');
const {verifyAToken} = require('../middlewares');
const User = require('../models/user');


const checkUserExistByUserId = async (userId) => {
    const REQ_USER = await User.findOne({
        where: {
            id: userId,
        },
    });
    //사용자 미존재
    if (REQ_USER === null) return false;
    else return REQ_USER;
};


router.post('/profile', verifyAToken, profileImageUploader.array('image'), (req, res) => {
    if (!req.files || req.files.length === 0) {
        return res.status(RES_ERROR_JSON.NO_IMAGE.status_code).json(RES_ERROR_JSON.NO_IMAGE.res_json);
    }

    const imageUrl = req.files.map((file) => file.location);
    const imageUrls = imageUrl.join(',');
    res.json({ imageUrls });
});

router.post('/post', verifyAToken, postImageUploader.array('image'), (req, res) => {
    if (!req.files || req.files.length === 0) {
        return res.status(RES_ERROR_JSON.NO_IMAGE.status_code).json(RES_ERROR_JSON.NO_IMAGE.res_json);
    }

    const imageUrl = req.files.map((file) => file.location);
    const imageUrls = imageUrl.join(',');
    res.json({ imageUrls });
});

router.post('/timetable', verifyAToken, timetableImageUploader.array('image'), (req, res) => {
    if (!req.files || req.files.length === 0) {
        return res.status(RES_ERROR_JSON.NO_IMAGE.status_code).json(RES_ERROR_JSON.NO_IMAGE.res_json);
    }

    const imageUrl = req.files.map((file) => file.location);
    const imageUrls = imageUrl.join(',');
    res.json({ imageUrls });
});

router.get('/emoticon', getEmoticon);
router.delete('/', imageRemover);

module.exports = router;
