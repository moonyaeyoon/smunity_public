const { MajorAuthPost } = require('../../models');

exports.getCertificateList = async (req, res, next) => {
    try {
        const certificateList = await MajorAuthPost.findAll({ where: { deletedAt: null } });
        res.json({ code: 200, payload: certificateList });
    } catch (err) {
        console.error(err);
    }
};

exports.addCertificate = async (req, res, next) => {
    try {
        const USER_ID = res.locals.decodes.user_id;
        const { imageUrl, content } = req.body;
        await MajorAuthPost.create({
            UserId: USER_ID,
            imageUrl: imageUrl,
            content: content,
        });
        res.json({ code: 200, payload: '인증 요청 성공' });
    } catch (err) {
        console.error(err);
        next(err);
    }
};
