const {Op} = require('sequelize')
const {User, Board, Post, Comment} = require("../../models");

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
        if(!req.headers.email || !req.params.majorId || req.params.majorId.length != 3 || !req.params.boardId || req.params.boardId.length != 3) return res.status(400).json({
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


        const listData = await Post.findAll({
            where:{
                BoardBoardId: req.params.majorId + req.params.boardId,
                // order: [['createdAt', 'DESC']]
            }
        });

        return res.status(200).json(listData)

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

        const detailData = await Post.findOne({
            where:{
                id: req.params.postId,
            },
            include:{
                model: Comment
            }
        });

        //익명 여부 처리
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
            code: 201,
            message: "게시글 수정 성공"
        })
        
    } catch (error) {
        console.error(err);
        next(error)
    }
}