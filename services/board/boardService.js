const { Op, NOW } = require('sequelize');
const { REQ_FORM_ERROR, USER_NOT_EXIST, USER_NO_AUTH, POST_NOT_EXIST } = require('../../constants/resErrorJson');
const { ADD_POST_SUCCESS, UPDATE_POST_SUCCESS, DELETE_POST_SUCCESS } = require('../../constants/resSuccessJson');
const { User, Board, Post, Comment, sequelize, Major, UserMajor, UserLikePost, UserScrapPost} = require('../../models');

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

exports.getBoardList = async (req, res, next) => {
    try {
        if (!req.headers.email || !req.params.board_id)
            return res.status(400).json({
                code: 400,
                message: '요청 문법 틀림',
            });

        const reqEmail = req.headers.email;
        const reqUser = await checkUserExist(reqEmail);
        if (reqUser === false)
            return res.status(401).json({
                code: 401,
                message: '잘못된 사용자 입니다',
            });

        //사용자 권한 없음
        let canRead = false;
        const reqUserMajors = await reqUser.getMajors();
        console.log(reqUserMajors);
        reqUserMajors.forEach((element) => {
            if (element.dataValues.id.toString().padStart(3, '0') === req.params.majorId) {
                canRead = true;
                return;
            }
        });
        if (!canRead)
            return res.status(403).json({
                code: 403,
                message: '게시판 접근 권한 없음',
            });

        //header의 listSize 힙법성 판단
        let finalListNumber = 0; //-1는 오류, 0는 전체, >=1는 갯수만큼 조회
        if (req.headers.listsize) {
            let listSize = req.headers.listsize;
            //숫자 검사
            if (!isNaN(listSize)) {
                //숫자면
                finalListNumber = Number(listSize);
            } else
                return res.status(400).json({
                    //숫자아니면
                    code: 400,
                    message: 'listSize는 숫자가 아님',
                });
            //숫자지만 0보다 큰 정수가 아님
            if (!Number.isInteger(finalListNumber) || finalListNumber <= 0)
                return res.status(400).json({
                    code: 400,
                    message: 'listSize가 0보다 큰 정수가 아님',
                });
        }

        let postList;
        if (finalListNumber == 0) {
            postList = await Post.findAll({
                where: {
                    BoardBoardId: req.params.majorId + req.params.boardId,
                    // order: [['createdAt', 'DESC']]
                },
                include: [
                    {
                        model: User,
                    },
                    {
                        model: Comment,
                    },
                ],
            });
        } else {
            postList = await Post.findAll({
                where: {
                    BoardBoardId: req.params.majorId + req.params.boardId,
                    // order: [['createdAt', 'DESC']]
                },
                include: [
                    {
                        model: User,
                    },
                    {
                        model: Comment,
                    },
                ],
                limit: finalListNumber,
            });
        }

        let finalResObject = Object();
        finalResObject['majorName'] = majorNameObject[req.params.majorId];
        finalResObject['boardName'] = boardNameObject[req.params.boardId];
        finalResObject['postList'] = Array();
        postList.forEach((e) => {
            const postInfo = e.dataValues;
            const nowPostObject = Object();
            //id
            nowPostObject['id'] = postInfo.id;
            //userId
            nowPostObject['userId'] = postInfo.UserId;
            //author
            let finalAuthor = e.User.nick;
            if (postInfo.isAnonymous == true) finalAuthor = '익명';
            nowPostObject['author'] = finalAuthor;
            //제목
            nowPostObject['title'] = postInfo.title;
            //imgUrl
            nowPostObject['imgUrl'] = postInfo.imgUrl;
            //views
            nowPostObject['views'] = postInfo.views;
            //likes
            nowPostObject['likes'] = postInfo.likes;
            //isAnonymous
            nowPostObject['isAnonymous'] = postInfo.isAnonymous;
            //댓글 수
            nowPostObject['commentNum'] = e.Comments.length;
            //작성 시간(createdAt)
            nowPostObject['createDate'] = toJSONLocal(postInfo.createdAt);

            finalResObject['postList'].push(nowPostObject);
        });

        return res.status(200).json(finalResObject);
    } catch (error) {
        console.error(error);
        next(error);
    }
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

exports.getBoardDatail = async (req, res, next) => {
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

exports.getSchoolNotiListPreview = async (req, res, next) => {
    try {
        const showListNum = 4;
        const finalReqsList = Array();
        const schoolNotiList = await Post.findAll({
            where: {
                BoardBoardId: '004003',
            },
            include: [
                {
                    model: User,
                },
                {
                    model: Comment,
                },
            ],
            limit: showListNum,
        });
        console.log(schoolNotiList);
        schoolNotiList.forEach((e) => {
            const postInfo = e.dataValues;
            const nowPostObject = Object();
            //postId
            nowPostObject['id'] = postInfo.id;
            //제목
            nowPostObject['title'] = postInfo.title;
            //닉네임
            nowPostObject['nickName'] = e.User.nick;

            //댓글 수
            nowPostObject['commentNum'] = e.Comments.length;

            //작성 시간(createdAt)
            nowPostObject['createDate'] = toJSONLocal(postInfo.createdAt);

            finalReqsList.push(nowPostObject);
        });
        console.log(finalReqsList);
        res.status(200).json(finalReqsList);
    } catch (err) {
        console.error(err);
        next(err);
    }
};

exports.getUserMajors = async (req, res, next) => {
    try {
        const USER_ID = res.locals.decodes.user_id;
        const NOW_USER = await User.findOne({ where: { id: USER_ID } });
        console.log(NOW_USER);

        const USER_MAJOR_LIST = await UserMajor.findAll({ where: {} });
        console.log(userMajorList);
        let finalResMajor = Array();
        userMajorList.forEach((e) => {
            majorInfo = e.dataValues;
            let nowNajorObject = Object();
            const nowRealMajorString = majorInfo.id.toString().padStart(3, '0').toString();
            nowNajorObject['majorId'] = nowRealMajorString;
            nowNajorObject['majorName'] = majorNameObject[nowRealMajorString];
            finalResMajor.push(nowNajorObject);
        });
        res.status(200).json(finalResMajor);
    } catch (err) {
        console.error(err);
        next(err);
    }
};
