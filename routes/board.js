const express = require('express');
const { isLoggedIn, isNotLoggedIn } = require('../middlewares');
const {createNewPost, getBoardList, getBoardDatail, updatePost, deletePost, getSchoolNotiListPreview, getUserMajors} = require("../services/board/boardService")

const router = express.Router();

router.get("/usermajors", getUserMajors)

router.get("/school/noti/list", getSchoolNotiListPreview)

router.post("/create", createNewPost)

router.get("/detail/:postId", getBoardDatail)

router.patch("/update/:postId", updatePost)

router.delete("/delete/:postId", deletePost)

router.get("/:majorId/:boardId/list", getBoardList)

module.exports = router;