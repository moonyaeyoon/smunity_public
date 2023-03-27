const { REQ_FORM_ERROR, USER_NOT_EXIST, USER_NO_AUTH, POST_NOT_EXIST, BOARD_NOT_EXIST } = require('../../constants/resErrorJson');
const { ADD_POST_SUCCESS, UPDATE_POST_SUCCESS, DELETE_POST_SUCCESS } = require('../../constants/resSuccessJson');
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

const UTC2KOR = (utcTimeString) => {
    Date.parse(dateString);
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

        await Post.create({
            title: req.body.title,
            content: req.body.content,
            is_anonymous: isUserSelectedAnonymous,
            user_id: NOW_USER.id,
            board_id: NOW_BOARD.id,
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
            COMMENT_LIST.push({
                comment_id: NOW_COMMENT.id,
                username: NOW_COMMENT.is_anonymous ? '익명' : NOW_COMMENT_USER.nickname,
                content: NOW_COMMENT.content,
                created_time: Date(Date.parse(NOW_COMMENT.createdAt)).toLocaleString("ko-KR", { timeZone: 'Asia/Seoul' }),
                updated_time: Date(Date.parse(NOW_COMMENT.updatedAt)).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }),
            });
        }

        const RES_POST_DETAIL = {
            post_id: NOW_POST.id,
            username: NOW_POST.is_anonymous ? '익명' : NOW_USER.nickname,
            title: NOW_POST.title,
            content: NOW_POST.content,
            image_urls: NOW_POST.img_urls || null,
            views: NOW_POST.views + 1,
            likes: NOW_POST.likes,
            scraps: NOW_POST.scraps,
            isLiked: USER_LIKED_INFO ? true : false,
            isScrap: USER_SCRAP_INFO ? true : false,
            comments: COMMENT_LIST,
            created_time: Date(Date.parse(NOW_POST.createdAt)).toLocaleString("ko-KR", { timeZone: 'Asia/Seoul' }),
            updated_time: Date(Date.parse(NOW_POST.updatedAt)).toLocaleString("ko-KR", { timeZone: 'Asia/Seoul' }),
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

        await NOW_POST.update({
            title: req.body.title,
            content: req.body.content,
        });

        return res.status(UPDATE_POST_SUCCESS.status_code).json(UPDATE_POST_SUCCESS.res_json);
    } catch (error) {
        console.error(err);
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
            const COMMENT_LIST = await Comment.findAll({ where: { post_id: NOW_POST.id } });
            RES_POSTS.push({
                post_id: NOW_POST.id,
                username: NOW_POST.is_anonymous ? '익명' : NOW_USER.nickname,
                title: NOW_POST.title,
                preview: NOW_POST.content.substr(0, 50),
                comments: COMMENT_LIST.length,
                views: NOW_POST.views,
                created_time: Date(Date.parse(NOW_POST.createdAt)).toLocaleString("ko-KR", { timeZone: 'Asia/Seoul' }),
                updated_time: Date(Date.parse(NOW_POST.updatedAt)).toLocaleString("ko-KR", { timeZone: 'Asia/Seoul' }),
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

exports.getMajorBoards = async (req, res, next) => {
    try {
        if (!req.params.major_id) {
            return res.status(REQ_FORM_ERROR.status_code).json(REQ_FORM_ERROR.res_json);
        }

        const BOARDS_INFO = await Board.findAll({ where: { major_id: req.params.major_id } });

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
                created_time: toJSONLocal(NOW_POST.createdAt), 
            });
        }
        res.status(200).json(RES_POST_LIST);
    } catch (err) {
        console.error(err);
        next(err);
    }
};
