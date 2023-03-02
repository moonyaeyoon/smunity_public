const {Op} = require('sequelize')
const {User, Board, Post, Comment, sequelize, Major} = require("../../models");

const majorNameObject = {
    "001": "컴퓨터과학과",
    "002": "휴먼지능정보공학전공",
    "003": "경제학과",
    "004": "상명대학교",
}
const boardNameObject = {
    "001": "자유게시판",
    "002": "비밀게시판",
    "003": "공지게시판",
}

const checkUserExist = async(userEmail) => {
    const reqUser = await User.findOne({
        where: {
            email: userEmail
        }
    })
    //사용자 미존재
    if(reqUser === null) return false
    else return reqUser
}

const toJSONLocal = (date) => {
    var local = new Date(date);
    local.setMinutes(date.getMinutes() - date.getTimezoneOffset());
    return local.toJSON().slice(0, 10);
}

exports.createNewPost = async(req, res, next) => {
    try{
        if(!req.headers.email || !req.body.title || !req.body.content || !req.body.majorId || req.body.majorId.length != 3 || !req.body.boardId || req.body.boardId.length != 3){
            return res.status(400).json({
                code: 400,
                message: "요청 문법 틀림"
            })
        } 

        const reqEmail = req.headers.email;
        const reqUser = await checkUserExist(reqEmail);
        if(reqUser === false) return res.status(401).json({
            code: 401,
            message: "잘못된 사용자 입니다"
        })

        //사용자 권한 없음
        const reqBoardId = req.body.majorId + req.body.boardId
        let canWrite = false
        const reqUserAllowBoards = await reqUser.getBoards();
        console.log(reqUserAllowBoards)
        reqUserAllowBoards.forEach(element => {
            if(element.dataValues.boardId === reqBoardId){
                console.log("nowreqId==" + reqBoardId)
                canWrite = true;
                return;
            }
        });
        if(!canWrite) return res.status(403).json({
            code: 403,
            message: "게시판 접근 권한 없음"
            
        });

        //익명 여부 처리
        let finalAnonymous = req.body.isAnonymous || false;
        if(finalAnonymous){
            const reqBoard = await Board.findOne({
                where: {
                    boardId: reqBoardId
                }
            });
            if(reqBoard.isCanAnonymous){
                finalAnonymous = req.body.isAnonymous
            }else{
                finalAnonymous = false
            }
        }
        await Post.create({
            title: req.body.title,
            content: req.body.content,
            isAnonymous: finalAnonymous,
            // views: 0,
            // likes: 0,
            BoardBoardId: reqBoardId,
            UserId: reqUser.id,
            MajorId: req.body.majorId
        })
        return res.status(201).json({
            code: 201,
            message: "게시글 작성 성공"
        })
    }catch(err){
        console.error(err)
        next(err);
    }
}

exports.getBoardList = async(req, res, next) => {
    try {
        if( !req.headers.email || !req.params.majorId || req.params.majorId.length != 3 || !req.params.boardId || req.params.boardId.length != 3) return res.status(400).json({
            code: 400,
            message: "요청 문법 틀림"
        })

        const reqEmail = req.headers.email;
        const reqUser = await checkUserExist(reqEmail);
        if(reqUser === false) return res.status(401).json({
            code: 401,
            message: "잘못된 사용자 입니다"
        })

        //사용자 권한 없음
        let canRead = false
        const reqUserMajors = await reqUser.getMajors();
        console.log(reqUserMajors)
        reqUserMajors.forEach(element => {
            if(element.dataValues.id.toString().padStart(3, '0') === req.params.majorId){
                canRead = true;
                return;
            }
        });
        if(!canRead) return res.status(403).json({
            code: 403,
            message: "게시판 접근 권한 없음"
        });

        //header의 listSize 힙법성 판단
        let finalListNumber = 0 //-1는 오류, 0는 전체, >=1는 갯수만큼 조회
        if(req.headers.listsize){
            let listSize = req.headers.listsize
            //숫자 검사
            if(!isNaN(listSize)){ //숫자면
                finalListNumber = Number(listSize)
            }else return res.status(400).json({ //숫자아니면
                code: 400,
                message: "listSize는 숫자가 아님"
            })
            //숫자지만 0보다 큰 정수가 아님
            if(!Number.isInteger(finalListNumber) || finalListNumber <= 0 ) return res.status(400).json({
                code: 400,
                message: "listSize가 0보다 큰 정수가 아님"
            })
        }

        let postList;
        if(finalListNumber == 0){
            postList = await Post.findAll({
                where:{
                    BoardBoardId: req.params.majorId + req.params.boardId,
                    // order: [['createdAt', 'DESC']]
                },
                include: [{
                    model: User, 
                }, 
                {
                    model: Comment, 
                }],
            });
        }else{
            postList = await Post.findAll({
                where:{
                    BoardBoardId: req.params.majorId + req.params.boardId,
                    // order: [['createdAt', 'DESC']]
                },
                include: [{
                    model: User, 
                }, 
                {
                    model: Comment, 
                }],
                limit: finalListNumber
            });
        }

        let finalResObject = Object();
        finalResObject["majorName"] = majorNameObject[req.params.majorId];
        finalResObject["boardName"] = boardNameObject[req.params.boardId];
        finalResObject["postList"] = Array();
        postList.forEach(e => {
            const postInfo = e.dataValues;
            const nowPostObject = Object()
            //id
            nowPostObject["id"] = postInfo.id
            //userId
            nowPostObject["userId"] = postInfo.UserId
            //author
            let finalAuthor = e.User.nick
            if(postInfo.isAnonymous == true) finalAuthor = "익명"
            nowPostObject["author"] = finalAuthor
            //제목
            nowPostObject["title"] = postInfo.title
            //imgUrl
            nowPostObject["imgUrl"] = postInfo.imgUrl
            //views
            nowPostObject["views"] = postInfo.views
            //likes
            nowPostObject["likes"] = postInfo.likes
            //isAnonymous
            nowPostObject["isAnonymous"] = postInfo.isAnonymous
            //댓글 수
            nowPostObject["commentNum"] = e.Comments.length
            //작성 시간(createdAt)
            nowPostObject["createDate"] = toJSONLocal(postInfo.createdAt)

            finalResObject["postList"].push(nowPostObject)
        });
    
        return res.status(200).json(finalResObject)

    } catch (error) {
        console.error(error);
        next(error);
    }
}

exports.getBoardDatail = async(req, res, next) => {
    try{
        if(!req.headers.email || !req.params.postId) return res.status(400).json({
            code: 400,
            message: "요청 문법 틀림"
        })
        //사용자 미존재
        const reqEmail = req.headers.email;
        const reqUser = await checkUserExist(reqEmail);
        if(reqUser === false) return res.status(401).json({
            code: 401,
            message: "잘못된 사용자 입니다"
        })

        //게시글 존재 여부
        const reqPost = await Post.findOne({
            where: {
                id: req.params.postId
            }
        })
        if(!reqPost) return res.status(402).json({
            code: 402,
            message: "게시글을 찾지 못했습니다"
        })

        //사용자 권한 없음
        let canRead = false
        const reqUserMajors = await reqUser.getMajors();
        console.log(reqUserMajors)
        reqUserMajors.forEach(element => {
            if(element.dataValues.id.toString().padStart(3, '0') === reqPost.MajorId.toString().padStart(3, '0')){
                canRead = true;
                return;
            }
        });
        if(!canRead) return res.status(403).json({
            code: 403,
            message: "게시글 접근 권한 없음"
        });

        let detailData = await Post.findOne({
            where:{
                id: req.params.postId,
            },
            include:{
                model: Comment
            }
        });


        const env = process.env.NODE_ENV || 'development';
        const config = require('../../config/config')[env];
        const oldViews = detailData.views
        const tempPostId = detailData.id
        const [result, metadata] = await sequelize.query(`UPDATE ${config.database}.posts SET views = ${oldViews + 1} WHERE id = ${tempPostId}`);
        
        console.log("before: " + detailData);
        //익명 여부 처리
        let postAuthorInfo = await detailData.getUser()
        let finalAuthor = postAuthorInfo.nick
        if(detailData.isAnonymous == true) finalAuthor = "익명"
        detailData.dataValues["author"] = finalAuthor

        console.log("after: " + detailData);
        return res.status(200).json(detailData)

    }catch(err){
        console.error(err);
        next(err);
    }
}

exports.updatePost = async(req, res, next) => {
    try {
        if(!req.headers.email || !req.params.postId || !req.body.title || !req.body.content) return res.status(400).json({
            code: 400,
            message: "요청 문법 틀림"
        })

        //사용자 미존재
        const reqEmail = req.headers.email;
        const reqUser = await checkUserExist(reqEmail);
        if(reqUser === false) return res.status(401).json({
            code: 401,
            message: "잘못된 사용자 입니다"
        })

        //게시글 존재 여부
        const reqPost = await Post.findOne({
            where: {
                id: req.params.postId
            }
        })
        if(!reqPost) return res.status(402).json({
            code: 402,
            message: "게시글을 찾지 못했습니다"
        })

        //작성자 != 요청자
        if(reqPost.UserId != reqUser.id) return res.status(403).json({
            code: 403,
            message: "게시글 수정 권한 없음"
        })

        await Post.update({
            title: req.body.title,
            content: req.body.content
        }, {
            where: {id: req.params.postId}
        })
        return res.status(200).json({
            code: 200,
            message: "게시글 수정 성공"
        })
        
    } catch (error) {
        console.error(err);
        next(error)
    }
}

exports.deletePost = async(req, res, next) => {
    try {
        if(!req.headers.email ||!req.params.postId) return res.status(400).json({
            code: 400,
            message: "요청 문법 틀림"
        })

        //사용자 미존재
        const reqEmail = req.headers.email;
        const reqUser = await checkUserExist(reqEmail);
        if(reqUser === false) return res.status(401).json({
            code: 401,
            message: "잘못된 사용자 입니다"
        })
    
        //게시글 존재 여부
        const reqPost = await Post.findOne({
            where: {
                id: req.params.postId
            }
        })
        if(!reqPost) return res.status(402).json({
            code: 402,
            message: "게시글을 찾지 못했습니다"
        })
    
        //작성자 != 요청자
        if(reqPost.UserId != reqUser.id) return res.status(403).json({
            code: 403,
            message: "게시글 수정 권한 없음"
        })
    
        await Post.destroy({
            where: {id: req.params.postId}
        })
        return res.status(200).json({
            code: 200,
            message: "게시글 삭제 성공"
        })
    } catch (err) {
        console.error(err);
        next(err)
    }
}

exports.getSchoolNotiListPreview = async(req, res, next) => {
    try {
        const showListNum = 4;
        const finalReqsList = Array()
        const schoolNotiList = await Post.findAll({
            where: {
                BoardBoardId: "004003"
            },
            include: [{
                model: User, 
            }, 
            {
                model: Comment, 
            }],
            limit: showListNum
        })
        console.log(schoolNotiList);
        schoolNotiList.forEach(e => {
            const postInfo = e.dataValues
            const nowPostObject = Object()
            //postId
            nowPostObject["id"] = postInfo.id
            //제목
            nowPostObject["title"] = postInfo.title
            //닉네임
            nowPostObject["nickName"] = e.User.nick

            //댓글 수
            nowPostObject["commentNum"] = e.Comments.length

            //작성 시간(createdAt)
            nowPostObject["createDate"] = toJSONLocal(postInfo.createdAt)

            finalReqsList.push(nowPostObject)
            
        });
        console.log(finalReqsList);
        res.status(200).json(finalReqsList)

    } catch (err) {
        console.error(err);
        next(err);
    }
}

exports.getUserMajors = async(req, res, next) => {
    try {
        if(!req.headers.email) return res.status(400).json({
            code: 400,
            message: "요청 문법 틀림"
        })
        //사용자 미존재
        const reqEmail = req.headers.email;
        const reqUser = await checkUserExist(reqEmail);
        if(reqUser === false) return res.status(401).json({
            code: 401,
            message: "잘못된 사용자 입니다"
        })

        const userMajorList = await reqUser.getMajors()
        console.log(userMajorList)
        let finalResMajor = Array()
        userMajorList.forEach(e => {
            majorInfo = e.dataValues
            let nowNajorObject = Object()
            const nowRealMajorString = majorInfo.id.toString().padStart(3, "0").toString()
            nowNajorObject[nowRealMajorString] = majorNameObject[nowRealMajorString]
            finalResMajor.push(nowNajorObject)
        });
        res.status(200).json(finalResMajor)

    } catch (err) {
        console.error(err);
        next(err);
    }
}