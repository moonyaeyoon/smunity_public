const express = require('express');
const cookieParser = require('cookie-parser');
const morgan = require("morgan");
const path = require('path');
const session = require('express-session');
const nunjucks = require('nunjucks');
const dotenv = require('dotenv');

dotenv.config();
const pageRouter = require('./routes/page');
const {sequelize} = require('./models');
const Major = require('./models/major');
const Board = require('./models/board');
const User = require('./models/user');

const app = express();
app.set('port', process.env.PORT || 8001);
app.set('view engine', 'html');
nunjucks.configure('views', {
    express: app,
    watch: true,
});

sequelize.sync({ force : true}).then(async() => {
    console.log('데이터베이스 연결 성공');
    //TODO: 나중에 rds로 db통합되면 이 쿼리는 없어집니다. local에서 자동으로 생성되도록 합니다. 최초 실행 이후에, 이 코드는 지워주세요.
    Major.create({majorName: "컴퓨터과학과"}) // 001
    Major.create({majorName: '휴먼지능정보공학전공'}); // 002
    Major.create({majorName: '경제학과'}); // 003
    
    //자유 게시판: 001, 비밀 게시판: 002, 공지게시판: 003

    Board.create({
        boardId: "001001",
        boardName: "CS Free Board",
        isCanAnonymous: false,
        isFree: true,
        MajorId: 1
    });
    Board.create({
        boardId: "001002",
        boardName: "CS Secret Board",
        isCanAnonymous: true,
        isFree: true,
        MajorId: 1
    });
    Board.create({
        boardId: "001003",
        boardName: "CS Noti Board",
        isCanAnonymous: false,
        isFree: false,
        MajorId: 1
    });
    Board.create({
        boardId: "002001",
        boardName: "Human Free Board",
        isCanAnonymous: false,
        isFree: true,
        MajorId: 2
    });

    const user1 = await User.create({
        email: "first@first.com",
        nick: "firstNick",
        password: "firstPW",
        provider: "local",
    });
    user1.addMajor(1);
    user1.addBoard("001001")
    user1.addBoard("001002")
    user1.addMajor(2);
    user1.addBoard("002001")

    const user2 = await User.create({
        email: "second@second.com",
        nick: "secondNick",
        password: "secondPW",
        provider: "local",
    })
    user2.addMajor(1)
    user2.addBoard("001001")
    user2.addBoard("001002")
    user2.addBoard("001003") //컴과 공지 게시판 쌉가능

}).catch((err) => {
    console.error(err);
});

app.use(morgan('dev'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(session({
    resave: false,
    saveUninitialized: false,
    secret: process.env.COOKIE_SECRET,
    cookie: {
        httpOnly: true,
        secure: false,
    },
}));

const cors = require('cors');
app.use(cors({
    credentials: false,
}))

app.use('/', pageRouter);

app.use((req, res, next) => {
    const error = new Error(`${req.method} ${req.url} 라우터가 없습니다.`);
    error.status = 404;
    next(error);
});

app.use((err, req, res, next) => {
    res.locals.message = err.message;
    res.locals.error = process.env.NODE_ENV !== 'production' ? err: {};
    res.status(err.status || 500);
    res.render('error');
});

app.listen(app.get('port'), () => {
    console.log(app.get('port'), '번 포트에서 대기 중');
})


