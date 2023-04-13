const express = require('express');
const { verifyAToken } = require('../middlewares');
const {
    deleteComment,
    updateComment,
    createNewComment,
    getCommentList,
    likeComment,
    reportComment,
} = require('../services/comment/comment');
const router = express.Router();

//댓글 작성
router.post('/create', verifyAToken, createNewComment);

//댓글 수정
router.patch('/update/:comment_id', verifyAToken, updateComment);

//댓글 삭제
router.delete('/delete/:comment_id', verifyAToken, deleteComment);

router.put('/like/:comment_id', verifyAToken, likeComment);

router.put('/report/:comment_id', verifyAToken, reportComment);

//test: 댓글 작성 확인용 API
router.get('/list', getCommentList);

module.exports = router;
