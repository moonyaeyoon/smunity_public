const logger = require('../../config/winstonConfig');
const {
    REQ_FORM_ERROR,
    USER_NOT_EXIST,
    USER_NO_AUTH,
    POST_NOT_EXIST,
    BOARD_NOT_EXIST,
    COMMENT_NOT_EXIST,
    COMMENT_ALREADY_REPORT,
} = require('../../constants/resErrorJson');
const {
    ADD_POST_SUCCESS,
    UPDATE_POST_SUCCESS,
    DELETE_POST_SUCCESS,
    ADD_COMMENT_SUCCESS,
    UPDATE_COMMENT_SUCCESS,
    DELETE_COMMENT_SUCCESS,
    LIKE_COMMENT_SUCCESS,
    UNDO_LIKE_COMMENT_SUCCESS,
    REPORT_COMMENT_SUCCESS,
    LIKE_COMMENT_SUCCESS_STATUS,
    likeCommentSuccessJson,
    UNDO_LIKE_COMMENT_SUCCESS_STATUS,
    UndoLikeCommentSuccessJson,
} = require('../../constants/resSuccessJson');
const {
    User,
    Board,
    Post,
    Comment,
    sequelize,
    Major,
    UserMajor,
    UserLikePost,
    UserScrapPost,
    UserLikeComment,
    UserReportComment,
} = require('../../models');
const App = require('../../config/slackConfig');
const env = process.env.NODE_ENV || 'development';
const config = require('../../config/config')[env];

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

exports.createNewComment = async (req, res, next) => {
    try {
        if (!req.body.post_id || !req.body.content || !req.body.type) {
            return res.status(REQ_FORM_ERROR.status_code).json(REQ_FORM_ERROR.res_json);
        }

        const NOW_USER = await checkUserExistByUserId(res.locals.decodes.user_id);
        if (!NOW_USER) {
            return res.status(USER_NOT_EXIST.status_code).json(USER_NOT_EXIST.res_json);
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
            type: req.body.type,
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
        return next(error);
    }
};

exports.createNewChildComment = async (req, res, next) => {
    try {
        if (!req.body.post_id || !req.body.content || !req.body.type || !req.body.parent) {
            return res.status(REQ_FORM_ERROR.status_code).json(REQ_FORM_ERROR.res_json);
        }

        const NOW_USER = await checkUserExistByUserId(res.locals.decodes.user_id);
        if (!NOW_USER) {
            return res.status(USER_NOT_EXIST.status_code).json(USER_NOT_EXIST.res_json);
        }

        const NOW_POST = await Post.findOne({ where: { id: req.body.post_id } });
        if (!NOW_POST) {
            return res.status(POST_NOT_EXIST.status_code).json(POST_NOT_EXIST.res_json);
        }

        const NOW_PARENT_COMMENT = await Comment.findOne({ where: { id: req.body.parent } });
        if (!NOW_PARENT_COMMENT) {
            return res.status(USER_NO_AUTH.status_code).json(USER_NO_AUTH.res_json);
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
            type: req.body.type,
            post_id: req.body.post_id,
            user_id: res.locals.decodes.user_id,
            content: req.body.content,
            is_anonymous: isUserSelectedAnonymous,
            group_id: req.body.parent,
            level: 1,
            childs: 0,
            parent_id: req.body.parent,
        });

        NOW_PARENT_COMMENT.childs = NOW_PARENT_COMMENT.childs + 1;
        await NOW_PARENT_COMMENT.save();

        return res.status(ADD_COMMENT_SUCCESS.status_code).json(ADD_COMMENT_SUCCESS.res_json);
    } catch (error) {
        return next(error);
    }
};

exports.updateComment = async (req, res, next) => {
    try {
        if (!req.params.comment_id || !req.body.content) {
            return res.status(REQ_FORM_ERROR.status_code).json(REQ_FORM_ERROR.res_json);
        }

        const NOW_USER = await checkUserExistByUserId(res.locals.decodes.user_id);
        if (!NOW_USER) {
            return res.status(USER_NOT_EXIST.status_code).json(USER_NOT_EXIST.res_json);
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
        return next(error);
    }
};

exports.deleteComment = async (req, res, next) => {
    try {
        if (!req.params.comment_id) {
            return res.status(REQ_FORM_ERROR.status_code).json(REQ_FORM_ERROR.res_json);
        }

        const NOW_USER = await checkUserExistByUserId(res.locals.decodes.user_id);
        if (!NOW_USER) {
            return res.status(USER_NOT_EXIST.status_code).json(USER_NOT_EXIST.res_json);
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
        return next(error);
    }
};

exports.likeComment = async (req, res, next) => {
    try {
        if (!req.body.comment_id) {
            return res.status(REQ_FORM_ERROR.status_code).json(REQ_FORM_ERROR.res_json);
        }

        const NOW_USER = await checkUserExistByUserId(res.locals.decodes.user_id);
        if (!NOW_USER) {
            return res.status(USER_NOT_EXIST.status_code).json(USER_NOT_EXIST.res_json);
        }

        const NOW_COMMENT = await Comment.findByPk(req.body.comment_id);
        if (!NOW_COMMENT) return res.status(COMMENT_NOT_EXIST.status_code).json(COMMENT_NOT_EXIST.res_json);

        //사용자 권한 체크
        let canRead = false;
        const NOW_USER_MAJOR_LIST = await UserMajor.findAll({ where: { user_id: NOW_USER.id } });
        const NOW_POST = await Post.findByPk(NOW_COMMENT.post_id);
        const NOW_BOARD = await Board.findOne({ where: { id: NOW_POST.board_id } });
        for (let index = 0; index < NOW_USER_MAJOR_LIST.length; index++) {
            if (NOW_USER_MAJOR_LIST[index].major_id === NOW_BOARD.major_id) {
                canRead = true;
                break;
            }
        }

        if (!canRead) {
            return res.status(USER_NO_AUTH.status_code).json(USER_NO_AUTH.res_json);
        }

        const NOW_LIKED_STATU = await UserLikeComment.findOne({
            where: {
                user_id: res.locals.decodes.user_id,
                comment_id: req.body.comment_id,
            },
        });

        if (!NOW_LIKED_STATU) {
            await UserLikeComment.create({
                user_id: res.locals.decodes.user_id,
                comment_id: req.body.comment_id,
            });

            await sequelize.query(`UPDATE ${config.database}.comments SET likes = likes+1 WHERE id = ${req.body.comment_id}`);
            const NEW_COMMENT = await Comment.findByPk(req.body.comment_id);
            return res.status(LIKE_COMMENT_SUCCESS_STATUS).json(likeCommentSuccessJson(NEW_COMMENT.likes));
        } else {
            await NOW_LIKED_STATU.destroy();
            await sequelize.query(`UPDATE ${config.database}.comments SET likes = likes-1 WHERE id = ${req.body.comment_id}`);
            const NEW_COMMENT = await Comment.findByPk(req.body.comment_id);
            return res.status(UNDO_LIKE_COMMENT_SUCCESS_STATUS).json(UndoLikeCommentSuccessJson(NEW_COMMENT.likes));
        }
    } catch (error) {
        return next(error);
    }
};

exports.reportComment = async (req, res, next) => {
    try {
        if (!req.params.comment_id) {
            return res.status(REQ_FORM_ERROR.status_code).json(REQ_FORM_ERROR.res_json);
        }

        const NOW_COMMENT = await Comment.findByPk(req.params.comment_id);
        if (!NOW_COMMENT) return res.status(COMMENT_NOT_EXIST.status_code).json(COMMENT_NOT_EXIST.res_json);

        //사용자 권한 체크
        let canRead = false;
        const NOW_USER_MAJOR_LIST = await UserMajor.findAll({ where: { user_id: res.locals.decodes.user_id } });
        const NOW_POST = await Post.findByPk(NOW_COMMENT.post_id);
        const NOW_BOARD = await Board.findOne({ where: { id: NOW_POST.board_id } });
        for (let index = 0; index < NOW_USER_MAJOR_LIST.length; index++) {
            if (NOW_USER_MAJOR_LIST[index].major_id === NOW_BOARD.major_id) {
                canRead = true;
                break;
            }
        }

        if (!canRead) {
            return res.status(USER_NO_AUTH.status_code).json(USER_NO_AUTH.res_json);
        }

        const NOW_REPORT_STATU = await UserReportComment.findOne({
            where: {
                user_id: res.locals.decodes.user_id,
                comment_id: req.params.comment_id,
            },
        });

        if (!NOW_REPORT_STATU) {
            await UserReportComment.create({
                user_id: res.locals.decodes.user_id,
                comment_id: req.params.comment_id,
            });

            await sequelize.query(`UPDATE ${config.database}.comments SET reports = reports+1 WHERE id = ${req.params.comment_id}`);

            //누적신고횟수를 반영하기 위해 다시 db서치하는거보다 +1로 코딩을 했습니다. 의견부탁드려요~

            const TOTAL_REPORTS = NOW_COMMENT.reports+1;
            //일정 횟수 누적되면 슬랙으로 알림
            if(TOTAL_REPORTS >= process.env.CRITICAL_POINT_REPORTS){

                App.client.chat.postMessage({
                    token: process.env.SLACK_BOT_TOKEN,
                    channel: process.env.SLACK_REPORT_CHANNEL,
                    text: `<${NOW_COMMENT.id}번 댓글 신고 접수> \n누적신고횟수: ${TOTAL_REPORTS}\n바로가기: ${process.env.POST_BASE_URL}/${NOW_BOARD.id}/${NOW_POST.id}\n내용: ${NOW_COMMENT.content}`,
                });
            }
            
            return res.status(REPORT_COMMENT_SUCCESS.status_code).json(REPORT_COMMENT_SUCCESS.res_json);
        } else {
            return res.status(COMMENT_ALREADY_REPORT.status_code).json(COMMENT_ALREADY_REPORT.res_json);
        }
    } catch (error) {
        return next(error);
    }
};

exports.getCommentList = async (req, res, next) => {
    try {
        const ALL_COMMENT_LIST = await Comment.findAll();
        res.status(200).json(ALL_COMMENT_LIST);
    } catch (error) {
        return next(error);
    }
};
