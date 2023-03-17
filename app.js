const express = require("express");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const path = require("path");
const session = require("express-session");
const nunjucks = require("nunjucks");
const dotenv = require("dotenv");
const passport = require("passport");
const passportConfig = require("./passport");

dotenv.config();
const pageRouter = require("./routes/page");
const { sequelize } = require("./models");
const Major = require("./models/major");
const Board = require("./models/board");
const User = require("./models/user");

const app = express();
passportConfig();
app.set("port", process.env.PORT || 8001);
app.set("view engine", "html");
nunjucks.configure("views", {
  express: app,
  watch: true,
});

const isResetDB = false

sequelize
  .sync({ force: isResetDB })
  .then(async () => {
    console.log("데이터베이스 연결 성공");
    if(isResetDB) resetDB()    
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
app.use(
  cors({
    // origin: "http://localhost:3000",
    // credentials: false,
  })
);

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

const resetDB = async() => {
  Major.create({ majorName: "상명대학교" }); 
    Major.create({ majorName: "컴퓨터과학과" }); 
    Major.create({ majorName: "휴먼지능정보공학전공" }); 
    Major.create({ majorName: "경제학과" }); 

    const majorList = ["상명대학교", "컴퓨터과학과", "휴먼지능정보공학전공", "경제학과"]

    for (let index = 0; index < majorList.length; index++) {
      const element = majorList[index];
      Board.create({
        boardName: `${element}-자유게시판`,
        isCanAnonymous: false,
        isNotice: false,
        MajorId: index+1,
      });
      Board.create({
        boardName: `${element}-비밀게시판`,
        isCanAnonymous: true,
        isNotice: false,
        MajorId: index+1,
      });
      Board.create({
        boardName: `${element}-공지게시판`,
        isCanAnonymous: false,
        isNotice: true,
        MajorId: index+1,
      });
    }

    const superUser = await User.create({
      schoolId: "193712345",
      email: "super",
      nickname: "학생복지팀",
      password: "$2b$12$r3bjYP.fhSyEt1Ychg1i/OosBxb1IaUJsw9yPuVFbLyKgzQiZTiy2",
      provider: "local",
    });

    superUser.addMajor(1);
    superUser.addMajor(2);
    superUser.addMajor(3);
    superUser.addMajor(4);
    for (let index = 1; index <= majorList.length * 3; index++) {
      superUser.addBoard(index);
    }
}