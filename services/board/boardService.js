const { Op, NOW } = require('sequelize');
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
        NOW_USER_MAJOR_LIST.forEach((e) => {
            if (e.dataValues.major_id === NOW_BOARD.dataValues.major_id) {
                canWrite = true;
                return;
            }
        });

        //공지 페이지일 경우 사용자 권한 확인.
        if (NOW_BOARD.is_notice == true) {
            canWrite = false;
            const NOTICE_ALLOW_ID_LIST = NOW_BOARD.notice_user_id_list.split(',');
            NOTICE_ALLOW_ID_LIST.forEach((allowedId) => {
                if (allowedId == NOW_USER.id) {
                    canWrite = true;
                    return;
                }
            });
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
    } catch (err) {
        console.error(err);
        next(err);
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
        NOW_USER_MAJOR_LIST.forEach((e) => {
            if (e.dataValues.major_id === NOW_BOARD.dataValues.major_id) {
                canRead = true;
                return;
            }
        });

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

        const COMMENT_LIST = await Comment.findAll({
            where: {
                post_id: req.params.post_id,
            },
        });

        let returnPostObject = Object();
        returnPostObject['id'] = NOW_POST.id;

        //post 익명 여부 처리
        returnPostObject['username'] = NOW_USER.nickname;
        if (NOW_POST.is_anonymous == true) {
            returnPostObject['username'] = '익명';
        }

        returnPostObject['title'] = NOW_POST.title;
        returnPostObject['content'] = NOW_POST.content;
        returnPostObject['image_urls'] = NOW_POST.img_urls || null;
        returnPostObject['views'] = NOW_POST.views + 1;
        returnPostObject['likes'] = NOW_POST.likes;
        returnPostObject['scraps'] = NOW_POST.scraps;

        //현재 사용자가 게시글에 좋아요를 눌렀는지 확인
        returnPostObject['isLiked'] = false;
        const USER_LIKED_INFO = await UserLikePost.findOne({ where: { user_id: NOW_USER.id, post_id: NOW_POST.id } });
        if (USER_LIKED_INFO) {
            returnPostObject['isLiked'] = true;
        }

        //현재 사용자가 게시글에 스크랩을 눌렀는지 확인
        returnPostObject['isScrap'] = false;
        const USER_SCRAP_INFO = await UserScrapPost.findOne({ where: { user_id: NOW_USER.id, post_id: NOW_POST.id } });
        if (USER_SCRAP_INFO) {
            returnPostObject['isScrap'] = true;
        }

        //싫어요는 나중에 ㅎㅎ

        returnPostObject['created_time'] = NOW_POST.createdAt;
        returnPostObject['updated_time'] = NOW_POST.updatedAt;

        return res.status(200).json(returnPostObject);
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
        NOW_USER_MAJOR_LIST.forEach((e) => {
            if (e.dataValues.major_id === NOW_BOARD.dataValues.major_id) {
                canRead = true;
                return;
            }
        });

        if (!canRead) {
            return res.status(USER_NO_AUTH.status_code).json(USER_NO_AUTH.res_json);
        }

        const POST_LIST = await Post.findAll({
            where: {
                board_id: req.params.board_id,
            },
            order: [
                ['created_at', 'DESC'],
            ],
        });

        let returnPostList = Array();
        POST_LIST.forEach((NOW_POST) => {
            let returnPostObject = Object();

            returnPostObject['id'] = NOW_POST.id;

            //post 익명 여부 처리
            returnPostObject['username'] = NOW_USER.nickname;
            if (NOW_POST.is_anonymous == true) {
                returnPostObject['username'] = '익명';
            }

            returnPostObject['title'] = NOW_POST.title;
            returnPostObject['preview'] = NOW_POST.content.substr(0, 50);

            //댓글 수 //TODO: 여기도 나중에 합시다
            returnPostObject['comments'] = 0;

            returnPostObject['created_time'] = NOW_POST.createdAt;
            returnPostObject['updated_time'] = NOW_POST.updatedAt;

            returnPostList.push(returnPostObject)
        });

        return res.status(200).json(returnPostList);
    } catch (err) {
        console.error(err);
        next(err);
    }
};

exports.getMajorBoards = async (req, res, next) => {
    try {
        if (!req.params.major_id) {
            return res.status(REQ_FORM_ERROR.status_code).json(REQ_FORM_ERROR.res_json);
        }

        const BOARD_LIST = await Board.findAll({ where: {major_id: req.params.major_id} });

        let finalResBoard = Array();
        BOARD_LIST.forEach(async(e) => {
            const NOW_BOARD = e.dataValues;
            let nowBoardObject = Object();
            nowBoardObject['board_name'] = NOW_BOARD.board_name;
            nowBoardObject['is_can_anonymous'] = NOW_BOARD.is_can_anonymous;
            nowBoardObject['is_notice'] = NOW_BOARD.is_notice;
            finalResBoard.push(nowBoardObject);
        });
        res.status(200).json(finalResBoard);
    } catch (err) {
        console.error(err);
        next(err);
    }
};

exports.getBoardPreview = async (req, res, next) => {
    try {
        if (!req.params.board_id || !req.body.count || +req.body.count <= 0) {
            return res.status(REQ_FORM_ERROR.status_code).json(REQ_FORM_ERROR.res_json);
        }

        if(!await Board.findOne({where: {id: req.params.board_id}})){
            return res.status(BOARD_NOT_EXIST.status_code).json(BOARD_NOT_EXIST.res_json);
        }

        const postList = Array();
        const BOARD_PREVIEW_POST_LIST = await Post.findAll({
            where: {
                board_id: req.params.board_id,
            },
            order: [
                ['created_at', 'DESC'],
            ],
            limit: req.body.count,
        });

        for (let index = 0; index < BOARD_PREVIEW_POST_LIST.length; index++) {
            const e = BOARD_PREVIEW_POST_LIST[index];
            const postInfo = e.dataValues;
            const nowPostObject = Object();
            //postId
            nowPostObject['id'] = postInfo.id;

            //제목
            nowPostObject['title'] = postInfo.title;

            //댓글 수
            nowPostObject['commentNum'] = await (await Comment.findAll({where: {post_id: postInfo.id}})).length;

            //작성 시간(createdAt)
            nowPostObject['createDate'] = toJSONLocal(postInfo.createdAt);

            postList.push(nowPostObject);
        }
        res.status(200).json(postList);
    } catch (err) {
        console.error(err);
        next(err);
    }
};