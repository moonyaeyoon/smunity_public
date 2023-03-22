const { MajorAuthPost, UserMajors } = require('../../models');

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
    const isUserMajorsDeleted = await deleteUserMajorList(userId);
    try {
        if (isUserMajorsDeleted) {
            majorList.forEach(async (element) => {
                await UserMajors.create({
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

const deleteUserMajorList = async (userId) => {
    try {
        await UserMajors.destroy({
            where: { user_id: userId },
        });
        return true;
    } catch (err) {
        console.err(err);
        next(err);
        return false;
    }
};
