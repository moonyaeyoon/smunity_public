const { MajorAuthPost, UserMajor } = require('../../models');

exports.getCertificateList = async (req, res, next) => {
    try {
        const certificateList = await MajorAuthPost.findAll();
        res.json({ certificateList: certificateList });
    } catch (err) {
        console.error(err);
        next(err);
    }
};

exports.addCertificate = async (req, res, next) => {
    try {
        const USER_ID = res.locals.decodes.user_id;
        const { imageUrl, content } = req.body;
        if (!imageUrl || !content) {
            return res.status(RES_ERROR_JSON.REQ_FORM_ERROR.status_code).json(RES_ERROR_JSON.REQ_FORM_ERROR.res_json);
        }
        await MajorAuthPost.create({
            user_id: USER_ID,
            image_url: imageUrl,
            content: content,
        });
        res.json({ isSuccess: true });
    } catch (err) {
        console.error(err);
        next(err);
    }
};

exports.updateMajorInCertificate = async (req, res, next) => {
    const { userId, majorList } = req.body;
    if (!userId || !majorList) {
        return res.status(RES_ERROR_JSON.REQ_FORM_ERROR.status_code).json(RES_ERROR_JSON.REQ_FORM_ERROR.res_json);
    }
    try {
        const isUserMajorsDeleted = await deleteUserMajorList(userId);
        if (isUserMajorsDeleted) {
            majorList.map(async (element) => {
                console.log(element);
                await UserMajor.create({
                    user_id: userId,
                    major_id: element,
                });
            });
            res.json({ isSuccess: true });
        }
    } catch (err) {
        console.error(err);
        next(err);
    }
};

exports.deletePostMajor = async (req, res, next) => {
    const { postId } = req.body;
    try {
        await MajorAuthPost.destroy({
            where: { id: postId },
        });
        res.json({ isSuccess: true });
        return true;
    } catch (err) {
        next(err);
        res.json({ isSuccess: false });
    }
};

const deleteUserMajorList = async (userId) => {
    try {
        await UserMajor.destroy({
            where: { user_id: userId },
        });
        return true;
    } catch (err) {
        console.err(err);
        next(err);
        return false;
    }
};

exports.getCertificateInfo = async (req, res, next) => {
    const { postId } = req.body;
    try {
        const certificateInfo = await MajorAuthPost.findByPk(postId);
        res.json({ certificateInfo: certificateInfo });
    } catch (err) {
        console.error(err);
        next(err);
    }
};
