const express = require("express");

const router = express.Router();

const { sequelize } = require("../models");

const BoardRouter = require("./board")

router.use((req, res, next) => {
  res.locals.user = null;
  res.locals.followerCount = 0;
  res.locals.followingCount = 0;
  res.locals.followerIdList = [];
  next();
});

router.use("/board", BoardRouter);

router.get("/", (req, res, next) => {
  res.send("랜딩페이지");
  //res.render('/', {title: "랜딩 페이지"});
});

module.exports = router;
