const express = require("express");

const router = express.Router();

const { sequelize } = require("../models");
const POST = require("../models/post");
const USER = require("../models/user");

router.use((req, res, next) => {
  res.locals.user = null;
  res.locals.followerCount = 0;
  res.locals.followingCount = 0;
  res.locals.followerIdList = [];
  next();
});

router.get("/board", async (req, res) => {
  const result = await POST.findAll();
  res.send(result);
});

router.post("/board/new", async (req, res) => {
  const { userId, title, content, majorId } = req.body.params;
  const result = await POST.create({
    title: title,
    content: content,
    UserId: userId,
    MajorId: majorId,
  });
  res.send(result);
});

router.get("/", (req, res, next) => {
  res.send("랜딩페이지");
  //res.render('/', {title: "랜딩 페이지"});
});

module.exports = router;
