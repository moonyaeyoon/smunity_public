const {
    REQ_FORM_ERROR,
    USER_NOT_EXIST,
    USER_NO_AUTH,
    POST_NOT_EXIST,
    BOARD_NOT_EXIST,
    COMMENT_NOT_EXIST,
} = require('../../constants/resErrorJson');
const {
    ADD_POST_SUCCESS,
    UPDATE_POST_SUCCESS,
    DELETE_POST_SUCCESS,
    ADD_COMMENT_SUCCESS,
    UPDATE_COMMENT_SUCCESS,
    DELETE_COMMENT_SUCCESS,
} = require('../../constants/resSuccessJson');
const { User, Board, Post, Comment, sequelize, Major, UserMajor, UserLikePost, UserScrapPost } = require('../../models');

const checkUserExist = async (userId) => {
    const reqUser = await User.findOne({
        where: {
            id: userId,
        },
    });
    //사용자 미존재
    if (reqUser === null) return false;
    else return reqUser;
};

const toJSONLocal = (date) => {
    var local = new Date(date);
    local.setMinutes(date.getMinutes() - date.getTimezoneOffset());
    return local.toJSON().slice(0, 10);
};

exports.createNewComment = async (req, res, next) => {
    try {
        if (!req.body.post_id || !req.body.content) {
            return res.status(REQ_FORM_ERROR.status_code).json(REQ_FORM_ERROR.res_json);
        }

        const NOW_POST = await Post.findOne({ where: { id: req.body.post_id } });
        if (!NOW_POST) {
            return res.status(POST_NOT_EXIST.status_code).json(POST_NOT_EXIST.res_json);
        }
        const NOW_BOARD = await Board.findOne({ where: { id: NOW_POST.board_id } });

        //사용자 권한 없음
        let canWrite = false;
        const NOW_USER_MAJOR_LIST = await UserMajor.findAll({ where: { user_id: res.locals.decodes.user_id } });
        NOW_USER_MAJOR_LIST.forEach((e) => {
            if (e.dataValues.major_id === NOW_BOARD.dataValues.major_id) {
                canWrite = true;
                return;
            }
        });

        //공지 페이지일 경우 사용자 권한 확인.
        // if (NOW_BOARD.is_notice == true) {
        //     canWrite = false;
        //     const NOTICE_ALLOW_ID_LIST = NOW_BOARD.notice_user_id_list.split(',');
        //     NOTICE_ALLOW_ID_LIST.forEach((allowedId) => {
        //         if (allowedId == res.locals.decodes.user_id) {
        //             canWrite = true;
        //             return;
        //         }
        //     });
        // }

        if (!canWrite) {
            return res.status(USER_NO_AUTH.status_code).json(USER_NO_AUTH.res_json);
        }

        //익명 여부 처리
        let isUserSelectedAnonymous = req.body.is_anonymous || false;
        if (isUserSelectedAnonymous) {
            //사용자가 익명을 선택했지만
            if (NOW_BOARD.is_can_anonymous == false) {
                //실제로도 게시판이 익명을 허용하지 않으면
                isUserSelectedAnonymous = false; //강제로 익명 선택 취소
            }
        }

        await Comment.create({
            post_id: req.body.post_id,
            user_id: res.locals.decodes.user_id,
            content: req.body.content,
            is_anonymous: isUserSelectedAnonymous,
            group_id: 0,
            level: 0,
            childs: 0,
            parent_id: 0,
        });

        return res.status(ADD_COMMENT_SUCCESS.status_code).json(ADD_COMMENT_SUCCESS.res_json);
    } catch (error) {
        console.error(error);
        next(error);
    }
};

exports.updateComment = async (req, res, next) => {
    try {
        if (!req.params.comment_id || !req.body.content) {
            return res.status(REQ_FORM_ERROR.status_code).json(REQ_FORM_ERROR.res_json);
        }

        //댓글 존재 여부
        const NOW_COMMENT = await Comment.findOne({
            where: {
                id: req.params.comment_id,
            },
        });
        if (!NOW_COMMENT) {
            return res.status(COMMENT_NOT_EXIST.status_code).json(COMMENT_NOT_EXIST.res_json);
        }

        //게시글 존재 여부
        const NOW_POST = await Post.findOne({
            where: {
                id: NOW_COMMENT.post_id,
            },
        });
        if (!NOW_POST) {
            return res.status(POST_NOT_EXIST.status_code).json(POST_NOT_EXIST.res_json);
        }

        //작성자 != 요청자
        if (NOW_COMMENT.user_id != res.locals.decodes.user_id) {
            return res.status(USER_NO_AUTH.status_code).json(USER_NO_AUTH.res_json);
        }

        await NOW_COMMENT.update({
            content: req.body.content,
        });

        return res.status(UPDATE_COMMENT_SUCCESS.status_code).json(UPDATE_COMMENT_SUCCESS.res_json);
    } catch (error) {
        console.error(error);
        next(error);
    }
};

exports.deleteComment = async (req, res, next) => {
    try {
        if (!req.params.comment_id) {
            return res.status(REQ_FORM_ERROR.status_code).json(REQ_FORM_ERROR.res_json);
        }

        //댓글 존재 여부
        const NOW_COMMENT = await Comment.findOne({
            where: {
                id: req.params.comment_id,
            },
        });
        if (!NOW_COMMENT) {
            return res.status(COMMENT_NOT_EXIST.status_code).json(COMMENT_NOT_EXIST.res_json);
        }

        //게시글 존재 여부
        const NOW_POST = await Post.findOne({
            where: {
                id: NOW_COMMENT.post_id,
            },
        });
        if (!NOW_POST) {
            return res.status(POST_NOT_EXIST.status_code).json(POST_NOT_EXIST.res_json);
        }

        //작성자 != 요청자
        if (NOW_COMMENT.user_id != res.locals.decodes.user_id) {
            return res.status(USER_NO_AUTH.status_code).json(USER_NO_AUTH.res_json);
        }

        await NOW_COMMENT.destroy();

        return res.status(DELETE_COMMENT_SUCCESS.status_code).json(DELETE_COMMENT_SUCCESS.res_json);
    } catch (error) {
        console.error(error);
        next(error);
    }
};

exports.getCommentList = async (req, res, next) => {
    try {
        const ALL_COMMENT_LIST = await Comment.findAll();
        res.status(200).json(ALL_COMMENT_LIST);
    } catch (error) {
        console.error(error);
        next(error);
    }
};
