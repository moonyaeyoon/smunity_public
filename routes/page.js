const express = require('express');

const router = express.Router();

const { sequelize } = require('../models');
const ManageRouter = require('./manage');
const BoardRouter = require('./board');
const AuthRouter = require('./auth');

const CommentRouter = require('./comment');
const ImageRouter = require('./upload');

router.use((req, res, next) => {
    res.locals.user = req.user;
    next();
});

router.use('/manage', ManageRouter);
router.use('/board', BoardRouter);
router.use('/comment', CommentRouter);

router.use('/auth', AuthRouter);

router.use('/upload', ImageRouter);

router.get('/', (req, res, next) => {
    res.send('랜딩페이지!!!');
    //res.render('/', {title: "랜딩 페이지"});
});

module.exports = router;
