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
    likePost,
    scrapPost,
    reportPost,
    getBoardInfo,
    getPostListByPaging,
    getPostListByCursor,
    searchTitleAndContent,
    searchTitleAndContentByCursor,
    searchTitleAndContentByPaging,
    getSchoolNoticeList,
    getBoardInfoByPostId,
    getHotPostPreview,
    getLostPostPreview,
    getLostPostDatail,
} = require('../services/board/boardService');

const router = express.Router();

router.post('/create', verifyAToken, createNewPost);

router.get('/detail/:post_id', verifyAToken, getPostDatail);

router.patch('/update/:post_id', verifyAToken, updatePost);

router.delete('/delete/:post_id', verifyAToken, deletePost);

router.get('/post_list/:board_id', verifyAToken, getPostList);

router.get('/paging', verifyAToken, getPostListByPaging);

router.get('/cursor', verifyAToken, getPostListByCursor);

router.get('/board_list/:major_id', getMajorBoards);

router.get('/preview', verifyAToken, getBoardPreview);

router.post('/like', verifyAToken, likePost);

router.put('/scrap/:post_id', verifyAToken, scrapPost);

router.put('/report/:post_id', verifyAToken, reportPost);

router.get('/info/:board_id', verifyAToken, getBoardInfo);

router.get('/info_by_postid/:post_id', verifyAToken, getBoardInfoByPostId);

router.get('/search', verifyAToken, searchTitleAndContent);

router.get('/search_paging', verifyAToken, searchTitleAndContentByPaging);

router.get('/search_cursor', verifyAToken, searchTitleAndContentByCursor);

router.get('/notice', getSchoolNoticeList);

router.get('/hot', getHotPostPreview);

router.get('/lost', getLostPostPreview);

router.get('/lost/detail/:post_id', getLostPostDatail);

module.exports = router;
