const express = require('express');
const { verifyAToken } = require('../middlewares');
const {
    createNewPost,
    getBoardList,
    getBoardDatail,
    updatePost,
    deletePost,
    getSchoolNotiListPreview,
    getUserMajors,
} = require('../services/board/boardService');

const router = express.Router();

router.get('/usermajors', verifyAToken, getUserMajors);

router.get('/school/noti/list', getSchoolNotiListPreview);

router.post('/create', verifyAToken, createNewPost);

router.get('/detail/:post_id', verifyAToken, getBoardDatail);

router.patch('/update/:post_id', verifyAToken, updatePost);

router.delete('/delete/:post_id', verifyAToken, deletePost);

router.get('/:board_id/list', getBoardList);

module.exports = router;
