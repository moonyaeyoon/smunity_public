const { Transaction, LOCK, Sequelize, Op, where } = require('sequelize');
const moment = require('moment');
const {
    REQ_FORM_ERROR,
    USER_NOT_EXIST,
    USER_NO_AUTH,
    POST_NOT_EXIST,
    BOARD_NOT_EXIST,
    POST_ALREADY_REPORT,
    MAJOR_NOT_EXIST,
} = require('../../constants/resErrorJson');
const {
    ADD_POST_SUCCESS,
    UPDATE_POST_SUCCESS,
    DELETE_POST_SUCCESS,
    LIKE_POST_SUCCESS,
    UNDO_LIKE_POST_SUCCESS,
    SCRAP_POST_SUCCESS,
    UNDO_SCRAP_POST_SUCCESS,
    REPORT_POST_SUCCESS,
    LIKE_POST_SUCCESS_STATUS,
    likePostSuccessJson,
    UNDO_LIKE_POST_SUCCESS_STATUS,
    UndoLikePostSuccessJson,
    SCRAP_POST_SUCCESS_STATUS,
    scrapPostSuccessJson,
    UNDO_SCRAP_POST_SUCCESS_STATUS,
    UndoScrapPostSuccessJson,
    END_OF_POST,
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
    UserReportPost,
    UserLikeComment,
} = require('../../models');
const { getSchoolNotice } = require('../../crawling/mongo/getNotice');

const env = process.env.NODE_ENV || 'development';
const config = require('../../config/config')[env];

const checkUserExist = async (userId) => {
    const REQ_USER = await User.findOne({
        where: {
            id: userId,
        },
    });
    //사용자 미존재
    if (REQ_USER === null) return false;
    else return REQ_USER;
};

exports.createNewPost = async (req, res, next) => {
    try {
        if (!req.body.title || !req.body.content || !req.body.board_id) {
            return res.status(REQ_FORM_ERROR.status_code).json(REQ_FORM_ERROR.res_json);
        }

        const NOW_USER = await checkUserExist(res.locals.decodes.user_id);

        //사용자 권한 없음
        let canWrite = false;
        const NOW_USER_MAJOR_LIST = await UserMajor.findAll({ where: { user_id: NOW_USER.id } });
        const NOW_BOARD = await Board.findOne({ where: { id: req.body.board_id } });
        for (let index = 0; index < NOW_USER_MAJOR_LIST.length; index++) {
            if (NOW_USER_MAJOR_LIST[index].major_id === NOW_BOARD.major_id) {
                canWrite = true;
                break;
            }
        }

        //공지 페이지일 경우 사용자 권한 확인.
        if (NOW_BOARD.is_notice == true) {
            canWrite = false;
            const NOTICE_ALLOW_ID_LIST = NOW_BOARD.notice_user_id_list.split(',');
            for (let index = 0; index < NOTICE_ALLOW_ID_LIST.length; index++) {
                if (NOTICE_ALLOW_ID_LIST[index] == NOW_USER.id) {
                    canWrite = true;
                    break;
                }
            }
        }

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

        //이미지 처리
        let imageUrlsString = '';
        if (req.files && req.files.length > 0) {
            for (let index = 0; index < req.files.length; index++) {
                imageUrlsString += req.files[index].path;
                if (index != req.files.length - 1) imageUrlsString += ',';
            }
        }

        await Post.create({
            title: req.body.title,
            content: req.body.content,
            is_anonymous: isUserSelectedAnonymous,
            user_id: NOW_USER.id,
            board_id: NOW_BOARD.id,
            img_urls: imageUrlsString,
        });
        return res.status(ADD_POST_SUCCESS.status_code).json(ADD_POST_SUCCESS.res_json);
    } catch (error) {
        console.error(error);
        next(error);
    }
};

exports.getPostDatail = async (req, res, next) => {
    try {
        if (!req.params.post_id) {
            return res.status(REQ_FORM_ERROR.status_code).json(REQ_FORM_ERROR.res_json);
        }

        const NOW_USER = await checkUserExist(res.locals.decodes.user_id);

        //게시글 존재 여부
        const NOW_POST = await Post.findOne({
            where: {
                id: req.params.post_id,
            },
        });
        if (!NOW_POST) {
            return res.status(POST_NOT_EXIST.status_code).json(POST_NOT_EXIST.res_json);
        }

        //사용자 권한 없음
        let canRead = false;
        const NOW_USER_MAJOR_LIST = await UserMajor.findAll({ where: { user_id: NOW_USER.id } });
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

        //post조회수 + 1 (UpdatedAt가 바뀌지 않도록 수동으로 쿼리문 작성함.)
        if (NOW_POST.user_id != NOW_USER.id) {
            //자신이 보면 조회수 안 올라가게 함.
            const env = process.env.NODE_ENV || 'development';
            const config = require('../../config/config')[env];
            const [result, metadata] = await sequelize.query(
                `UPDATE ${config.database}.posts SET views = ${NOW_POST.views + 1} WHERE id = ${NOW_POST.id}`
            );
        }

        //좋아요/스크랩 체크여부
        const USER_LIKED_INFO = await UserLikePost.findOne({ where: { user_id: NOW_USER.id, post_id: NOW_POST.id } });
        const USER_SCRAP_INFO = await UserScrapPost.findOne({ where: { user_id: NOW_USER.id, post_id: NOW_POST.id } });

        const COMMENTS_INFO = await Comment.findAll({
            where: {
                post_id: req.params.post_id,
            },
            order: [['created_at', 'DESC']],
        });

        const COMMENT_LIST = [];
        for (let index = 0; index < COMMENTS_INFO.length; index++) {
            const NOW_COMMENT = COMMENTS_INFO[index];
            const NOW_COMMENT_USER = await User.findOne({ where: { id: NOW_COMMENT.user_id } });
            const COMMENT_LIKED_INFO = await UserLikeComment.findOne({ where: { user_id: NOW_USER.id, comment_id: NOW_COMMENT.id } });
            COMMENT_LIST.push({
                comment_id: NOW_COMMENT.id,
                username: NOW_COMMENT.is_anonymous ? '익명' : NOW_COMMENT_USER.nickname,
                user_id: NOW_COMMENT.user_id,
                content: NOW_COMMENT.content,
                likes: NOW_COMMENT.likes,
                isLiked: COMMENT_LIKED_INFO ? true : false,
                created_time: moment(NOW_COMMENT.createdAt).utcOffset(9).format('YYYY.MM.DD_HH:mm:ss'),
                updated_time: moment(NOW_COMMENT.updatedAt).utcOffset(9).format('YYYY.MM.DD_HH:mm:ss'),
            });
        }

        const AUTHOR_USER = await User.findByPk(NOW_POST.user_id);
        const RES_POST_DETAIL = {
            post_id: NOW_POST.id,
            username: NOW_POST.is_anonymous ? '익명' : AUTHOR_USER.nickname,
            user_id: NOW_POST.user_id,
            title: NOW_POST.title,
            content: NOW_POST.content,
            image_urls: NOW_POST.img_urls || null,
            views: NOW_POST.views + 1,
            likes: NOW_POST.likes,
            scraps: NOW_POST.scraps,
            isLiked: USER_LIKED_INFO ? true : false,
            isScrap: USER_SCRAP_INFO ? true : false,
            comments: COMMENT_LIST,
            created_time: moment(NOW_POST.createdAt).utcOffset(9).format('YYYY.MM.DD_HH:mm:ss'),
            updated_time: moment(NOW_POST.updatedAt).utcOffset(9).format('YYYY.MM.DD_HH:mm:ss'),
        };
        return res.status(200).json(RES_POST_DETAIL);
    } catch (err) {
        console.error(err);
        next(err);
    }
};

exports.updatePost = async (req, res, next) => {
    try {
        if (!req.params.post_id || !req.body.title || !req.body.content) {
            return res.status(REQ_FORM_ERROR.status_code).json(REQ_FORM_ERROR.res_json);
        }

        //게시글 존재 여부
        const NOW_POST = await Post.findOne({
            where: {
                id: req.params.post_id,
            },
        });
        if (!NOW_POST) {
            return res.status(POST_NOT_EXIST.status_code).json(POST_NOT_EXIST.res_json);
        }

        //작성자 != 요청자
        if (NOW_POST.user_id != res.locals.decodes.user_id) {
            return res.status(USER_NO_AUTH.status_code).json(USER_NO_AUTH.res_json);
        }

        let imageUrlsString = '';
        if (req.body.image_url_list) {
            for (let index = 0; index < req.body.image_url_list.length; index++) {
                imageUrlsString += req.body.image_url_list[index];
                if (index != req.body.image_url_list.length - 1) imageUrlsString += ','; //마지막 사진이 아닐 때 뒤에 콤마 붙이기
            }
        }

        const NOW_BOARD = await Board.findByPk(NOW_POST.board_id);
        //익명 여부 처리
        let isUserSelectedAnonymous = req.body.is_anonymous || false;
        if (isUserSelectedAnonymous) {
            //사용자가 익명을 선택했지만
            if (NOW_BOARD.is_can_anonymous == false) {
                //실제로도 게시판이 익명을 허용하지 않으면
                isUserSelectedAnonymous = false; //강제로 익명 선택 취소
            }
        }

        await NOW_POST.update({
            title: req.body.title,
            content: req.body.content,
            is_anonymous: isUserSelectedAnonymous,
            img_urls: imageUrlsString,
        });

        return res.status(UPDATE_POST_SUCCESS.status_code).json(UPDATE_POST_SUCCESS.res_json);
    } catch (error) {
        console.error(error);
        next(error);
    }
};

exports.deletePost = async (req, res, next) => {
    try {
        if (!req.params.post_id) {
            return res.status(REQ_FORM_ERROR.status_code).json(REQ_FORM_ERROR.res_json);
        }

        //게시글 존재 여부
        const NOW_POST = await Post.findOne({
            where: {
                id: req.params.post_id,
            },
        });
        if (!NOW_POST) {
            return res.status(POST_NOT_EXIST.status_code).json(POST_NOT_EXIST.res_json);
        }

        //작성자 != 요청자
        if (NOW_POST.user_id != res.locals.decodes.user_id) {
            return res.status(USER_NO_AUTH.status_code).json(USER_NO_AUTH.res_json);
        }

        await NOW_POST.destroy();

        return res.status(DELETE_POST_SUCCESS.status_code).json(DELETE_POST_SUCCESS.res_json);
    } catch (error) {
        console.error(err);
        next(error);
    }
};

exports.getPostList = async (req, res, next) => {
    try {
        if (!req.params.board_id) {
            return res.status(REQ_FORM_ERROR.status_code).json(REQ_FORM_ERROR.res_json);
        }

        const NOW_USER = await checkUserExist(res.locals.decodes.user_id);

        //게시판 존재 여부
        const NOW_BOARD = await Board.findOne({
            where: {
                id: req.params.board_id,
            },
        });
        if (!NOW_BOARD) {
            return res.status(BOARD_NOT_EXIST.status_code).json(BOARD_NOT_EXIST.res_json);
        }

        //사용자 권한 없음
        let canRead = false;
        const NOW_USER_MAJOR_LIST = await UserMajor.findAll({ where: { user_id: NOW_USER.id } });
        for (let index = 0; index < NOW_USER_MAJOR_LIST.length; index++) {
            if (NOW_USER_MAJOR_LIST[index].major_id === NOW_BOARD.major_id) {
                canRead = true;
                break;
            }
        }

        if (!canRead) {
            return res.status(USER_NO_AUTH.status_code).json(USER_NO_AUTH.res_json);
        }

        const POSTS_INFO = await Post.findAll({
            where: {
                board_id: req.params.board_id,
            },
            order: [['created_at', 'DESC']],
        });

        const RES_POSTS = [];
        for (let index = 0; index < POSTS_INFO.length; index++) {
            const NOW_POST = POSTS_INFO[index];
            const COMMENT_COUNT = await Comment.count({ where: { post_id: NOW_POST.id } });
            RES_POSTS.push({
                post_id: NOW_POST.id,
                username: NOW_POST.is_anonymous ? '익명' : NOW_USER.nickname,
                title: NOW_POST.title,
                preview: NOW_POST.content.substr(0, 50),
                comments: COMMENT_COUNT,
                views: NOW_POST.views,
                likes: NOW_POST.likes,
                created_time: moment(NOW_POST.createdAt).utcOffset(9).format('YYYY.MM.DD_HH:mm:ss'), //utcOffset: UTC시간대 | format: moment지원 양식
                updated_time: moment(NOW_POST.updatedAt).utcOffset(9).format('YYYY.MM.DD_HH:mm:ss'),
            });
        }
        //요청 헤더로 정렬기준 받아서 판별
        if (res.header.sorting === 'likes') {
            RES_POSTS.sort((a, b) => b.likes - a.likes);
        }

        const RES_BOARD_AND_POSTS = {
            major_name: NOW_BOARD.board_name.split('-')[0],
            board_name: NOW_BOARD.board_name.split('-')[1],
            posts: RES_POSTS,
        };
        return res.status(200).json(RES_BOARD_AND_POSTS);
    } catch (error) {
        console.error(error);
        next(error);
    }
};

exports.getMajorBoards = async (req, res, next) => {
    try {
        if (!req.params.major_id) {
            return res.status(REQ_FORM_ERROR.status_code).json(REQ_FORM_ERROR.res_json);
        }

        const BOARDS_INFO = await Board.findAll({ where: { major_id: req.params.major_id } });
        if (!BOARDS_INFO) return res.status(MAJOR_NOT_EXIST.status_code).json(MAJOR_NOT_EXIST.res_json);

        const RES_BOARD_LIST = [];
        for (let index = 0; index < BOARDS_INFO.length; index++) {
            const NOW_BOARD = BOARDS_INFO[index];
            RES_BOARD_LIST.push({
                board_id: NOW_BOARD.id,
                board_name: NOW_BOARD.board_name,
                is_can_anonymous: NOW_BOARD.is_can_anonymous,
                is_notice: NOW_BOARD.is_notice,
            });
        }
        res.status(200).json(RES_BOARD_LIST);
    } catch (error) {
        console.error(error);
        next(error);
    }
};

exports.getBoardPreview = async (req, res, next) => {
    try {
        if (!req.query.board_id || !req.query.limit_post_num) {
            return res.status(REQ_FORM_ERROR.status_code).json(REQ_FORM_ERROR.res_json);
        }

        //limit_post_num가 양의 정수인지 판단
        if (isNaN(req.query.limit_post_num) || parseInt(req.query.limit_post_num) <= 0) {
            return res.status(REQ_FORM_ERROR.status_code).json(REQ_FORM_ERROR.res_json);
        }

        const NOW_BOARD = await Board.findOne({ where: { id: req.query.board_id } });
        if (!NOW_BOARD) {
            return res.status(BOARD_NOT_EXIST.status_code).json(BOARD_NOT_EXIST.res_json);
        }

        const BOARD_PREVIEW_POSTS_INFO = await Post.findAll({
            where: {
                board_id: req.query.board_id,
            },
            order: [['created_at', 'DESC']],
            limit: parseInt(req.query.limit_post_num),
        });

        const RES_POST_LIST = [];

        for (let index = 0; index < BOARD_PREVIEW_POSTS_INFO.length; index++) {
            const NOW_POST = BOARD_PREVIEW_POSTS_INFO[index];
            const COMMENT_LIST = await Comment.findAll({ where: { post_id: NOW_POST.id } });
            RES_POST_LIST.push({
                post_id: NOW_POST.id,
                title: NOW_POST.title,
                comments: COMMENT_LIST.length,
                created_time: moment(NOW_POST.createdAt).utcOffset(9).format('YYYY.MM.DD_HH:mm:ss'),
            });
        }
        res.status(200).json(RES_POST_LIST);
    } catch (err) {
        console.error(err);
        next(err);
    }
};

exports.getBoardInfo = async (req, res, next) => {
    try {
        if (!req.params.board_id) {
            return res.status(REQ_FORM_ERROR.status_code).json(REQ_FORM_ERROR.res_json);
        }

        const NOW_BOARD = await Board.findOne({ where: { id: req.params.board_id } });
        if (!NOW_BOARD) {
            return res.status(BOARD_NOT_EXIST.status_code).json(BOARD_NOT_EXIST.res_json);
        }

        const NOW_MAJOR = await Major.findByPk(NOW_BOARD.major_id);

        const RES_BOARD_INFO = {
            major_id: NOW_MAJOR.id,
            major_name: NOW_MAJOR.major_name,
            board_id: NOW_BOARD.id,
            board_name: NOW_BOARD.board_name.split('-')[1],
            is_can_anonymous: NOW_BOARD.is_can_anonymous,
            is_notice: NOW_BOARD.is_notice,
        };
        res.status(200).json(RES_BOARD_INFO);
    } catch (err) {
        console.error(err);
        next(err);
    }
};

exports.getBoardInfoByPostId = async (req, res, next) => {
    try {
        if (!req.params.post_id) {
            return res.status(REQ_FORM_ERROR.status_code).json(REQ_FORM_ERROR.res_json);
        }

        //게시글 존재 여부
        const NOW_POST = await Post.findOne({
            where: {
                id: req.params.post_id,
            },
        });
        if (!NOW_POST) {
            return res.status(POST_NOT_EXIST.status_code).json(POST_NOT_EXIST.res_json);
        }

        const NOW_BOARD = await Board.findByPk(NOW_POST.board_id);
        if (!NOW_BOARD) {
            return res.status(BOARD_NOT_EXIST.status_code).json(BOARD_NOT_EXIST.res_json);
        }

        const NOW_MAJOR = await Major.findByPk(NOW_BOARD.major_id);

        const RES_BOARD_INFO = {
            major_id: NOW_MAJOR.id,
            major_name: NOW_MAJOR.major_name,
            board_id: NOW_BOARD.id,
            board_name: NOW_BOARD.board_name.split('-')[1],
            is_can_anonymous: NOW_BOARD.is_can_anonymous,
            is_notice: NOW_BOARD.is_notice,
        };
        res.status(200).json(RES_BOARD_INFO);
    } catch (err) {
        console.error(err);
        next(err);
    }
};

exports.likePost = async (req, res, next) => {
    try {
        if (!req.params.post_id) {
            return res.status(REQ_FORM_ERROR.status_code).json(REQ_FORM_ERROR.res_json);
        }

        //TODO: 사용자 권한 체크 아직 안함

        const NOW_POST = await Post.findByPk(req.params.post_id);
        if (!NOW_POST) return res.status(POST_NOT_EXIST.status_code).json(POST_NOT_EXIST.res_json);

        const NOW_LIKED_STATU = await UserLikePost.findOne({
            where: {
                user_id: res.locals.decodes.user_id,
                post_id: req.params.post_id,
            },
        });

        if (!NOW_LIKED_STATU) {
            await UserLikePost.create({
                user_id: res.locals.decodes.user_id,
                post_id: req.params.post_id,
            });

            await sequelize.query(`UPDATE ${config.database}.posts SET likes = likes+1 WHERE id = ${req.params.post_id}`);
            const NEW_POST = await Post.findByPk(req.params.post_id);
            return res.status(LIKE_POST_SUCCESS_STATUS).json(likePostSuccessJson(NEW_POST.likes));
        } else {
            await NOW_LIKED_STATU.destroy();
            await sequelize.query(`UPDATE ${config.database}.posts SET likes = likes-1 WHERE id = ${req.params.post_id}`);
            const NEW_POST = await Post.findByPk(req.params.post_id);
            return res.status(UNDO_LIKE_POST_SUCCESS_STATUS).json(UndoLikePostSuccessJson(NEW_POST.likes));
        }
    } catch (error) {
        console.error(error);
        next(error);
    }
};

exports.scrapPost = async (req, res, next) => {
    try {
        if (!req.params.post_id) {
            return res.status(REQ_FORM_ERROR.status_code).json(REQ_FORM_ERROR.res_json);
        }

        //TODO: 사용자 권한 체크 아직 안함

        const NOW_POST = await Post.findByPk(req.params.post_id);
        if (!NOW_POST) return res.status(POST_NOT_EXIST.status_code).json(POST_NOT_EXIST.res_json);

        const NOW_SCRAP_STATU = await UserScrapPost.findOne({
            where: {
                user_id: res.locals.decodes.user_id,
                post_id: req.params.post_id,
            },
        });

        if (!NOW_SCRAP_STATU) {
            await UserScrapPost.create({
                user_id: res.locals.decodes.user_id,
                post_id: req.params.post_id,
            });

            await sequelize.query(`UPDATE ${config.database}.posts SET scraps = scraps+1 WHERE id = ${req.params.post_id}`);
            const NEW_POST = await Post.findByPk(req.params.post_id);
            return res.status(SCRAP_POST_SUCCESS_STATUS).json(scrapPostSuccessJson(NEW_POST.scraps));
        } else {
            await NOW_SCRAP_STATU.destroy();
            await sequelize.query(`UPDATE ${config.database}.posts SET scraps = scraps-1 WHERE id = ${req.params.post_id}`);
            const NEW_POST = await Post.findByPk(req.params.post_id);
            return res.status(UNDO_SCRAP_POST_SUCCESS_STATUS).json(UndoScrapPostSuccessJson(NEW_POST.scraps));
        }
    } catch (error) {
        console.error(error);
        next(error);
    }
};

exports.reportPost = async (req, res, next) => {
    try {
        if (!req.params.post_id) {
            return res.status(REQ_FORM_ERROR.status_code).json(REQ_FORM_ERROR.res_json);
        }

        //TODO: 사용자 권한 체크 아직 안함

        const NOW_POST = await Post.findByPk(req.params.post_id);
        if (!NOW_POST) return res.status(POST_NOT_EXIST.status_code).json(POST_NOT_EXIST.res_json);

        const NOW_REPORT_STATU = await UserReportPost.findOne({
            where: {
                user_id: res.locals.decodes.user_id,
                post_id: req.params.post_id,
            },
        });

        if (!NOW_REPORT_STATU) {
            await UserReportPost.create({
                user_id: res.locals.decodes.user_id,
                post_id: req.params.post_id,
            });

            await sequelize.query(`UPDATE ${config.database}.posts SET reports = reports+1 WHERE id = ${req.params.post_id}`);
            return res.status(REPORT_POST_SUCCESS.status_code).json(REPORT_POST_SUCCESS.res_json);
        } else {
            return res.status(POST_ALREADY_REPORT.status_code).json(POST_ALREADY_REPORT.res_json);
        }
    } catch (error) {
        console.error(error);
        next(error);
    }
};

exports.getPostListByPaging = async (req, res, next) => {
    try {
        if (!req.query.board_id || isNaN(req.query.board_id) || !req.query.now_page || isNaN(req.query.now_page)) {
            return res.status(REQ_FORM_ERROR.status_code).json(REQ_FORM_ERROR.res_json);
        }

        //게시판 존재 여부
        const NOW_BOARD = await Board.findOne({
            where: {
                id: req.query.board_id,
            },
        });
        if (!NOW_BOARD) {
            return res.status(BOARD_NOT_EXIST.status_code).json(BOARD_NOT_EXIST.res_json);
        }

        const NOW_USER = await checkUserExist(res.locals.decodes.user_id);

        //사용자 권한 없음
        let canRead = false;
        const NOW_USER_MAJOR_LIST = await UserMajor.findAll({ where: { user_id: NOW_USER.id } });
        for (let index = 0; index < NOW_USER_MAJOR_LIST.length; index++) {
            if (NOW_USER_MAJOR_LIST[index].major_id === NOW_BOARD.major_id) {
                canRead = true;
                break;
            }
        }

        if (!canRead) {
            return res.status(USER_NO_AUTH.status_code).json(USER_NO_AUTH.res_json);
        }

        let countPerPage = 10;
        if (!isNaN(req.query.per_page)) {
            countPerPage = parseInt(req.query.per_page);
        }
        const LIMIT = countPerPage;
        const OFFSET = 0 + (req.query.now_page - 1) * LIMIT;
        const TOTAL_PAGE = Math.ceil((await Post.count()) / countPerPage);

        const POSTS_INFO = await Post.findAll({
            where: {
                board_id: req.query.board_id,
            },
            order: [['created_at', 'DESC']],
            offset: OFFSET,
            limit: LIMIT,
        });

        if (POSTS_INFO.length == 0) {
            return res.status(END_OF_POST.status_code).json();
        }

        const RES_POSTS = [];
        for (let index = 0; index < POSTS_INFO.length; index++) {
            const NOW_POST = POSTS_INFO[index];
            const COMMENT_COUNT = await Comment.count({ where: { post_id: NOW_POST.id } });
            RES_POSTS.push({
                post_id: NOW_POST.id,
                username: NOW_POST.is_anonymous ? '익명' : NOW_USER.nickname,
                title: NOW_POST.title,
                preview: NOW_POST.content.substr(0, 50),
                comments: COMMENT_COUNT,
                views: NOW_POST.views,
                created_time: moment(NOW_POST.createdAt).utcOffset(9).format('YYYY.MM.DD_HH:mm:ss'), //utcOffset: UTC시간대 | format: moment지원 양식
                updated_time: moment(NOW_POST.updatedAt).utcOffset(9).format('YYYY.MM.DD_HH:mm:ss'),
            });
        }

        const RES_BOARD_AND_POSTS = {
            major_name: NOW_BOARD.board_name.split('-')[0],
            board_name: NOW_BOARD.board_name.split('-')[1],
            total_page: TOTAL_PAGE,
            posts: RES_POSTS,
        };
        return res.status(200).json(RES_BOARD_AND_POSTS);
    } catch (error) {
        console.error(error);
        next(error);
    }
};

exports.getPostListByCursor = async (req, res, next) => {
    try {
        if (!req.query.board_id || isNaN(req.query.board_id) || !req.query.last_id || isNaN(req.query.last_id)) {
            return res.status(REQ_FORM_ERROR.status_code).json(REQ_FORM_ERROR.res_json);
        }

        //게시판 존재 여부
        const NOW_BOARD = await Board.findOne({
            where: {
                id: req.query.board_id,
            },
        });
        if (!NOW_BOARD) {
            return res.status(BOARD_NOT_EXIST.status_code).json(BOARD_NOT_EXIST.res_json);
        }

        const NOW_USER = await checkUserExist(res.locals.decodes.user_id);

        //사용자 권한 없음
        let canRead = false;
        const NOW_USER_MAJOR_LIST = await UserMajor.findAll({ where: { user_id: NOW_USER.id } });
        for (let index = 0; index < NOW_USER_MAJOR_LIST.length; index++) {
            if (NOW_USER_MAJOR_LIST[index].major_id === NOW_BOARD.major_id) {
                canRead = true;
                break;
            }
        }

        if (!canRead) {
            return res.status(USER_NO_AUTH.status_code).json(USER_NO_AUTH.res_json);
        }

        let countPerPage = 5;
        if (!isNaN(req.query.per_page)) {
            countPerPage = parseInt(req.query.per_page);
        }

        const LIMIT = countPerPage;

        let postsInfo = [];
        if (req.query.last_id == 0) {
            postsInfo = await Post.findAll({
                where: {
                    board_id: req.query.board_id,
                },
                order: [['created_at', 'DESC']],
                limit: LIMIT,
            });
        } else {
            postsInfo = await Post.findAll({
                where: {
                    board_id: req.query.board_id,
                    id: {
                        [Op.lt]: [req.query.last_id],
                    },
                },
                order: [['created_at', 'DESC']],
                limit: LIMIT,
            });
        }

        if (postsInfo.length == 0) {
            return res.status(END_OF_POST.status_code).json();
        }

        const RES_POSTS = [];
        for (let index = 0; index < postsInfo.length; index++) {
            const NOW_POST = postsInfo[index];
            const COMMENT_COUNT = await Comment.count({ where: { post_id: NOW_POST.id } });
            RES_POSTS.push({
                post_id: NOW_POST.id,
                username: NOW_POST.is_anonymous ? '익명' : NOW_USER.nickname,
                title: NOW_POST.title,
                preview: NOW_POST.content.substr(0, 50),
                comments: COMMENT_COUNT,
                views: NOW_POST.views,
                created_time: moment(NOW_POST.createdAt).utcOffset(9).format('YYYY.MM.DD_HH:mm:ss'), //utcOffset: UTC시간대 | format: moment지원 양식
                updated_time: moment(NOW_POST.updatedAt).utcOffset(9).format('YYYY.MM.DD_HH:mm:ss'),
            });
        }

        const RES_BOARD_AND_POSTS = {
            major_name: NOW_BOARD.board_name.split('-')[0],
            board_name: NOW_BOARD.board_name.split('-')[1],
            posts: RES_POSTS,
        };
        return res.status(200).json(RES_BOARD_AND_POSTS);
    } catch (error) {
        console.error(error);
        next(error);
    }
};

exports.searchTitleAndContent = async (req, res, next) => {
    try {
        if (!req.query.keyword) {
            return res.status(REQ_FORM_ERROR.status_code).json(REQ_FORM_ERROR.res_json);
        }

        const NOW_USER = await checkUserExist(res.locals.decodes.user_id);
        const ALLOW_USER_MAJORS = await UserMajor.findAll({ where: { user_id: res.locals.decodes.user_id } });
        const ALL_ALLOW_BOARD_ID = [];
        for (let index = 0; index < ALLOW_USER_MAJORS.length; index++) {
            const nowMajotId = ALLOW_USER_MAJORS[index].major_id;
            const majorBoards = await Board.findAll({
                where: {
                    major_id: nowMajotId,
                },
            });
            for (let i = 0; i < majorBoards.length; i++) {
                ALL_ALLOW_BOARD_ID.push(majorBoards[i].id);
            }
        }

        const SEARCH_POST_LIST = await Post.findAll({
            where: {
                board_id: ALL_ALLOW_BOARD_ID,
                [Op.or]: [
                    {
                        title: {
                            [Op.like]: `%${req.query.keyword}%`,
                        },
                    },
                    {
                        content: {
                            [Op.like]: `%${req.query.keyword}%`,
                        },
                    },
                ],
            },
            order: [['created_at', 'DESC']],
        });

        const RES_POSTS = [];
        for (let index = 0; index < SEARCH_POST_LIST.length; index++) {
            const NOW_POST = SEARCH_POST_LIST[index];
            const NOW_BOARD = await Board.findByPk(NOW_POST.board_id);
            const COMMENT_COUNT = await Comment.count({ where: { post_id: NOW_POST.id } });
            RES_POSTS.push({
                major_name: NOW_BOARD.board_name.split('-')[0],
                board_name: NOW_BOARD.board_name.split('-')[1],
                board_id: NOW_POST.board_id,
                post_id: NOW_POST.id,
                username: NOW_POST.is_anonymous ? '익명' : NOW_USER.nickname,
                title: NOW_POST.title,
                preview: NOW_POST.content.substr(0, 50),
                comments: COMMENT_COUNT,
                views: NOW_POST.views,
                likes: NOW_POST.likes,
                created_time: moment(NOW_POST.createdAt).utcOffset(9).format('YYYY.MM.DD_HH:mm:ss'), //utcOffset: UTC시간대 | format: moment지원 양식
                updated_time: moment(NOW_POST.updatedAt).utcOffset(9).format('YYYY.MM.DD_HH:mm:ss'),
            });
        }
        //요청 헤더로 정렬기준 받아서 판별
        if (res.header.sorting === 'likes') {
            RES_POSTS.sort((a, b) => b.likes - a.likes);
        }
        return res.status(200).json(RES_POSTS);
    } catch (error) {
        console.error(error);
        next(error);
    }
};

exports.searchTitleAndContentByPaging = async (req, res, next) => {
    try {
        if (!req.query.keyword || !req.query.now_page || isNaN(req.query.now_page)) {
            return res.status(REQ_FORM_ERROR.status_code).json(REQ_FORM_ERROR.res_json);
        }

        const NOW_USER = await checkUserExist(res.locals.decodes.user_id);
        const ALLOW_USER_MAJORS = await UserMajor.findAll({ where: { user_id: res.locals.decodes.user_id } });
        const ALL_ALLOW_BOARD_ID = [];
        for (let index = 0; index < ALLOW_USER_MAJORS.length; index++) {
            const nowMajotId = ALLOW_USER_MAJORS[index].major_id;
            const majorBoards = await Board.findAll({
                where: {
                    major_id: nowMajotId,
                },
            });
            for (let i = 0; i < majorBoards.length; i++) {
                ALL_ALLOW_BOARD_ID.push(majorBoards[i].id);
            }
        }

        let countPerPage = 10;
        if (!isNaN(req.query.per_page)) {
            countPerPage = parseInt(req.query.per_page);
        }
        const LIMIT = countPerPage;
        const OFFSET = 0 + (req.query.now_page - 1) * LIMIT;

        const SEARCH_POST_LIST = await Post.findAll({
            where: {
                board_id: ALL_ALLOW_BOARD_ID,
                [Op.or]: [
                    {
                        title: {
                            [Op.like]: `%${req.query.keyword}%`,
                        },
                    },
                    {
                        content: {
                            [Op.like]: `%${req.query.keyword}%`,
                        },
                    },
                ],
            },
            order: [['created_at', 'DESC']],
            offset: OFFSET,
            limit: LIMIT,
        });

        if (SEARCH_POST_LIST.length == 0) {
            return res.status(END_OF_POST.status_code).json();
        }

        const RES_POSTS = [];
        for (let index = 0; index < SEARCH_POST_LIST.length; index++) {
            const NOW_POST = SEARCH_POST_LIST[index];
            const NOW_BOARD = await Board.findByPk(NOW_POST.board_id);
            const COMMENT_COUNT = await Comment.count({ where: { post_id: NOW_POST.id } });
            RES_POSTS.push({
                major_name: NOW_BOARD.board_name.split('-')[0],
                board_name: NOW_BOARD.board_name.split('-')[1],
                board_id: NOW_POST.board_id,
                post_id: NOW_POST.id,
                username: NOW_POST.is_anonymous ? '익명' : NOW_USER.nickname,
                title: NOW_POST.title,
                preview: NOW_POST.content.substr(0, 50),
                comments: COMMENT_COUNT,
                views: NOW_POST.views,
                likes: NOW_POST.likes,
                created_time: moment(NOW_POST.createdAt).utcOffset(9).format('YYYY.MM.DD_HH:mm:ss'), //utcOffset: UTC시간대 | format: moment지원 양식
                updated_time: moment(NOW_POST.updatedAt).utcOffset(9).format('YYYY.MM.DD_HH:mm:ss'),
            });
        }
        //요청 헤더로 정렬기준 받아서 판별
        if (res.header.sorting === 'likes') {
            RES_POSTS.sort((a, b) => b.likes - a.likes);
        }

        const SEARCH_POST_COUNT = await Post.count({
            where: {
                board_id: ALL_ALLOW_BOARD_ID,
                [Op.or]: [
                    {
                        title: {
                            [Op.like]: `%${req.query.keyword}%`,
                        },
                    },
                    {
                        content: {
                            [Op.like]: `%${req.query.keyword}%`,
                        },
                    },
                ],
            },
        });
        const TOTAL_PAGE = Math.ceil(SEARCH_POST_COUNT / countPerPage);
        const RES_BOARD_AND_POSTS = {
            total_page: TOTAL_PAGE,
            posts: RES_POSTS,
        };

        return res.status(200).json(RES_BOARD_AND_POSTS);
    } catch (error) {
        console.error(error);
        next(error);
    }
};

exports.searchTitleAndContentByCursor = async (req, res, next) => {
    try {
        if (!req.query.keyword || !req.query.last_id || isNaN(req.query.last_id)) {
            return res.status(REQ_FORM_ERROR.status_code).json(REQ_FORM_ERROR.res_json);
        }

        const NOW_USER = await checkUserExist(res.locals.decodes.user_id);
        const ALLOW_USER_MAJORS = await UserMajor.findAll({ where: { user_id: res.locals.decodes.user_id } });
        const ALL_ALLOW_BOARD_ID = [];
        for (let index = 0; index < ALLOW_USER_MAJORS.length; index++) {
            const nowMajotId = ALLOW_USER_MAJORS[index].major_id;
            const majorBoards = await Board.findAll({
                where: {
                    major_id: nowMajotId,
                },
            });
            for (let i = 0; i < majorBoards.length; i++) {
                ALL_ALLOW_BOARD_ID.push(majorBoards[i].id);
            }
        }

        let countPerPage = 5;
        if (!isNaN(req.query.per_page)) {
            countPerPage = parseInt(req.query.per_page);
        }

        const LIMIT = countPerPage;

        let searcPostsList = [];
        if (req.query.last_id == 0) {
            searchPostsList = await Post.findAll({
                where: {
                    board_id: ALL_ALLOW_BOARD_ID,
                    [Op.or]: [
                        {
                            title: {
                                [Op.like]: `%${req.query.keyword}%`,
                            },
                        },
                        {
                            content: {
                                [Op.like]: `%${req.query.keyword}%`,
                            },
                        },
                    ],
                },
                order: [['created_at', 'DESC']],
                limit: LIMIT,
            });
        } else {
            searchPostsList = await Post.findAll({
                where: {
                    board_id: ALL_ALLOW_BOARD_ID,
                    id: {
                        [Op.lt]: [req.query.last_id],
                    },
                    [Op.or]: [
                        {
                            title: {
                                [Op.like]: `%${req.query.keyword}%`,
                            },
                        },
                        {
                            content: {
                                [Op.like]: `%${req.query.keyword}%`,
                            },
                        },
                    ],
                },
                order: [['created_at', 'DESC']],
                limit: LIMIT,
            });
        }

        if (searchPostsList.length == 0) {
            return res.status(END_OF_POST.status_code).json();
        }

        const RES_POSTS = [];
        for (let index = 0; index < searchPostsList.length; index++) {
            const NOW_POST = searchPostsList[index];
            const NOW_BOARD = await Board.findByPk(NOW_POST.board_id);
            const COMMENT_COUNT = await Comment.count({ where: { post_id: NOW_POST.id } });
            RES_POSTS.push({
                major_name: NOW_BOARD.board_name.split('-')[0],
                board_name: NOW_BOARD.board_name.split('-')[1],
                board_id: NOW_POST.board_id,
                post_id: NOW_POST.id,
                username: NOW_POST.is_anonymous ? '익명' : NOW_USER.nickname,
                title: NOW_POST.title,
                preview: NOW_POST.content.substr(0, 50),
                comments: COMMENT_COUNT,
                views: NOW_POST.views,
                likes: NOW_POST.likes,
                created_time: moment(NOW_POST.createdAt).utcOffset(9).format('YYYY.MM.DD_HH:mm:ss'), //utcOffset: UTC시간대 | format: moment지원 양식
                updated_time: moment(NOW_POST.updatedAt).utcOffset(9).format('YYYY.MM.DD_HH:mm:ss'),
            });
        }
        //요청 헤더로 정렬기준 받아서 판별
        if (res.header.sorting === 'likes') {
            RES_POSTS.sort((a, b) => b.likes - a.likes);
        }
        return res.status(200).json(RES_POSTS);
    } catch (error) {
        console.error(error);
        next(error);
    }
};

exports.getSchoolNoticeList = async (req, res, next) => {
    try {
        const POSTS_INFO = await getSchoolNotice();

        const RES_POSTS = [];
        for (let index = 0; index < POSTS_INFO.length; index++) {
            const NOW_POST = POSTS_INFO[index];
            RES_POSTS.push({
                post_id: NOW_POST['index'],
                title: NOW_POST['title'],
                views: NOW_POST['views'],
                created_time: NOW_POST['date'],
            });
        }
        return res.status(200).json(RES_POSTS);
    } catch (error) {
        console.error(error);
        next(error);
    }
};
