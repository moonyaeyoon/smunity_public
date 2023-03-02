const express = require("express");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const path = require("path");
const session = require("express-session");
const nunjucks = require("nunjucks");
const dotenv = require("dotenv");
const passport = require("passport");
const passportConfig = require("./passport")

dotenv.config();
const pageRouter = require('./routes/page');
const {sequelize} = require('./models');
const Major = require('./models/major');
const Board = require('./models/board');
const User = require('./models/user');

const app = express();
passportConfig();
app.set("port", process.env.PORT || 8001);
app.set("view engine", "html");
nunjucks.configure("views", {
  express: app,
  watch: true,
});

sequelize
  .sync({ force: true })
  .then(async () => {
    console.log("데이터베이스 연결 성공");
    //TODO: 나중에 rds로 db통합되면 이 쿼리는 없어집니다. local에서 자동으로 생성되도록 합니다. 최초 실행 이후에, 이 코드는 지워주세요.
    Major.create({ majorName: "컴퓨터과학과" }); // 001
    Major.create({ majorName: "휴먼지능정보공학전공" }); // 002
    Major.create({ majorName: "경제학과" }); // 003
    Major.create({ majorName: "상명대학교" }); // 004

    //자유 게시판: 001, 비밀 게시판: 002, 공지게시판: 003

    Board.create({
      boardId: "001001",
      boardName: "CS Free Board",
      isCanAnonymous: false,
      isFree: true,
      MajorId: 1,
    });
    Board.create({
      boardId: "001002",
      boardName: "CS Secret Board",
      isCanAnonymous: true,
      isFree: true,
      MajorId: 1,
    });
    Board.create({
      boardId: "001003",
      boardName: "CS Noti Board",
      isCanAnonymous: false,
      isFree: false,
      MajorId: 1,
    });
    Board.create({
      boardId: "002001",
      boardName: "Human Free Board",
      isCanAnonymous: false,
      isFree: true,
      MajorId: 2,
    });
    Board.create({
      boardId: "002002",
      boardName: "Human Secret Board",
      isCanAnonymous: true,
      isFree: true,
      MajorId: 2,
    });
    Board.create({
      boardId: "002003",
      boardName: "Human Noti Board",
      isCanAnonymous: false,
      isFree: false,
      MajorId: 2,
    });
    Board.create({
      boardId: "003001",
      boardName: "Economics Free Board",
      isCanAnonymous: false,
      isFree: true,
      MajorId: 3,
    });
    Board.create({
      boardId: "003002",
      boardName: "Economics Secret Board",
      isCanAnonymous: true,
      isFree: true,
      MajorId: 3,
    });
    Board.create({
      boardId: "003003",
      boardName: "Economics Noti Board",
      isCanAnonymous: false,
      isFree: false,
      MajorId: 3,
    });
    Board.create({
      boardId: "004001",
      boardName: "School Free Board",
      isCanAnonymous: false,
      isFree: true,
      MajorId: 4,
    });
    Board.create({
      boardId: "004002",
      boardName: "School Secret Board",
      isCanAnonymous: true,
      isFree: true,
      MajorId: 4,
    });
    Board.create({
      boardId: "004003",
      boardName: "School Noti Board",
      isCanAnonymous: false,
      isFree: false,
      MajorId: 4,
    });

    const superUser = await User.create({
      email: "super",
      nick: "학생복지팀",
      password: "$2b$12$r3bjYP.fhSyEt1Ychg1i/OosBxb1IaUJsw9yPuVFbLyKgzQiZTiy2",
      provider: "local",
    });
    superUser.addMajor(1);
    superUser.addMajor(2);
    superUser.addMajor(3);
    superUser.addMajor(4);
    superUser.addBoard("001001");
    superUser.addBoard("001002");
    superUser.addBoard("001003"); //컴과 공지 게시판 쌉가능
    superUser.addBoard("002001");
    superUser.addBoard("002002");
    superUser.addBoard("002003"); //휴먼과 공지 게시판 쌉가능
    superUser.addBoard("003001");
    superUser.addBoard("003002");
    superUser.addBoard("003003"); //경제학과 공지 게시판 쌉가능
    superUser.addBoard("004001");
    superUser.addBoard("004002");
    superUser.addBoard("004003"); //학교 공지 게시판 쌉가능
  })
  .catch((err) => {
    console.error(err);
  });

app.use(morgan("dev"));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(
  session({
    resave: false,
    saveUninitialized: false,
    secret: process.env.COOKIE_SECRET,
    cookie: {
        httpOnly: true,
        secure: false,
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

const cors = require("cors");
app.use(cors());

app.use("/", pageRouter);

app.use((req, res, next) => {
  const error = new Error(`${req.method} ${req.url} 라우터가 없습니다.`);
  error.status = 404;
  next(error);
});

app.use((err, req, res, next) => {
  res.locals.message = err.message;
  res.locals.error = process.env.NODE_ENV !== "production" ? err : {};
  res.status(err.status || 500);
  console.log(err);
  res.render("error");
});

app.listen(app.get("port"), () => {
  console.log(app.get("port"), "번 포트에서 대기 중");
});
