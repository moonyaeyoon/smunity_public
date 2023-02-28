const express = require('express');
const {createNewPost, getBoardList, getBoardDatail, updatePost, } = require("../services/board/boardService")

const router = express.Router();

router.post("/create", createNewPost)

router.get("/:majorId/:boardId/list", getBoardList)

router.get("/detail/:postId", getBoardDatail)

router.patch("/update/:postId", updatePost)

module.exports = router;