const { REQ_FORM_ERROR } = require('../../constants/resErrorJson');
const { MajorAuthPost, UserMajor, MajorRejectPost } = require('../../models');
const App = require('../../config/slackConfig');

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
        const CONTENT = req.body.content;
        const IMAGE_URL = req.body.image_url;
        if (!IMAGE_URL) {
            return res.status(REQ_FORM_ERROR.status_code).json(REQ_FORM_ERROR.res_json);
        }
        await MajorAuthPost.create({
            user_id: USER_ID,
            image_url: IMAGE_URL,
            content: CONTENT || null,
        });

        // TODO: 슬랙봇 따로 생성
        App.client.chat.postMessage({
            token: process.env.SLACK_BOT_TOKEN,
            channel: process.env.SLACK_ERROR_CHANNEL,
            text: `<학과 인증 요청> \nurl: ${process.env.MANAGEMENT_PAGE} \ncontent: ${CONTENT} \nimage: ${IMAGE_URL}`,
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
            await UserMajor.create({
                user_id: userId,
                major_id: 1,
            });
            majorList.map(async (element) => {
                console.log(element);
                if (element != '1') {
                    await UserMajor.create({
                        user_id: userId,
                        major_id: element,
                    });
                }
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

exports.rejectCertificate = async (req, res, next) => {
    const { userId, rejectText } = req.body;
    try {
        await MajorRejectPost.create({
            reject_text: rejectText,
            user_id: userId,
        });
        res.json({ isSuccess: true });
    } catch (err) {
        console.error(err);
        next(err);
    }
};
