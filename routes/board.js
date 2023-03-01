const express = require('express');
const {createNewPost, getBoardList, getBoardDatail, updatePost, deletePost, getSchoolNotiListPreview} = require("../services/board/boardService")

const router = express.Router();

router.get("/school/noti/list", getSchoolNotiListPreview)

router.post("/create", createNewPost)

router.get("/detail/:postId", getBoardDatail)

router.patch("/update/:postId", updatePost)

router.delete("/delete/:postId", deletePost)

router.get("/:majorId/:boardId/list", getBoardList)

module.exports = router;