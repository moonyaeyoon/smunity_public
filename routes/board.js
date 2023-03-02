const express = require('express');
const { isLoggedIn, isNotLoggedIn } = require('../middlewares');
const {createNewPost, getBoardList, getBoardDatail, updatePost, deletePost, getSchoolNotiListPreview, getUserMajors} = require("../services/board/boardService")

const router = express.Router();

router.get("/usermajors", isLoggedIn, getUserMajors)

router.get("/school/noti/list", getSchoolNotiListPreview)

router.post("/create", isLoggedIn, createNewPost)

router.get("/detail/:postId", isLoggedIn, getBoardDatail)

router.patch("/update/:postId", isLoggedIn, updatePost)

router.delete("/delete/:postId", isLoggedIn, deletePost)

router.get("/:majorId/:boardId/list", isLoggedIn, getBoardList)

module.exports = router;