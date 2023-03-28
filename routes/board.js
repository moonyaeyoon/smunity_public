const express = require('express');
const { verifyAToken } = require('../middlewares');
const {
    createNewPost,
    getPostList,
    getPostDatail,
    updatePost,
    deletePost,
    getSchoolNotiListPreview,
    getUserMajors,
    getMajorBoards,
    getBoardPreview,
} = require('../services/board/boardService');

const router = express.Router();

router.post('/create', verifyAToken, createNewPost);

router.get('/detail/:post_id', verifyAToken, getPostDatail);

router.patch('/update/:post_id', verifyAToken, updatePost);

router.delete('/delete/:post_id', verifyAToken, deletePost);

router.get('/post_list/:board_id', verifyAToken, getPostList);

router.get('/board_list/:major_id', getMajorBoards);

router.get('/preview', verifyAToken, getBoardPreview);

module.exports = router;
