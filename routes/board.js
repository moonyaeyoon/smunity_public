const express = require('express');
const {createNewPost, getBoardList} = require("../services/board/boardService")

const router = express.Router();

router.post("/create", createNewPost)

router.get("/:majorId/:boardId/list", getBoardList)

module.exports = router;