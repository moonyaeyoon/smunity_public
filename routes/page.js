const express = require("express");

const router = express.Router();

const { sequelize } = require("../models");

const BoardRouter = require("./board")
const AuthRouter = require("./auth")

router.use((req, res, next) => {
  res.locals.user = req.user;
  res.locals.followerCount = 0;
  res.locals.followingCount = 0;
  res.locals.followerIdList = [];
  next();
});

router.use("/board", BoardRouter);

router.use("/auth", AuthRouter)

router.get("/", (req, res, next) => {
  res.send("랜딩페이지");
  //res.render('/', {title: "랜딩 페이지"});
});

module.exports = router;
