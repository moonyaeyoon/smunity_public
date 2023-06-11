require('dotenv').config();
const express = require('express');
const { sequelize } = require('./models');
const { resetDB } = require('./reset/resetDB');
const sentryConfig = require('./config/sentryConfig');
const pageRouter = require('./routes/page');
const cors = require('cors');
const { sendErrorLog } = require('./constants/resErrorJson');
const { apiLimiter } = require('./middlewares');

//필요성 확인
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const path = require('path');
const session = require('express-session');
const logger = require('./config/winstonConfig');

const app = express();
sentryConfig.initbeforeStart(app);
app.set('views', './public/views'); // New!!
app.set('view engine', 'ejs'); // New!!
app.set('view engine', 'html');
app.set('port', process.env.PORT || 8001);

//DB 리셋 명령
let isResetDB = false;
if (process.argv[2] === 'realwanttoreset') isResetDB = true;

sequelize
    .sync({ force: isResetDB })
    .then(async () => {
        console.log('데이터베이스 연결 성공');
        if (isResetDB) resetDB();
    })
    .catch((err) => {
        console.error(err);
    });

//로그 관리
if (process.env.NODE_ENV == 'prodution') app.use(morgan('combined', { stream: logger.stream }));
else app.use(morgan('dev', { stream: logger.stream }));

app.use(express.static(path.join(__dirname, 'public')));
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
app.use(
    cors({
        // origin: "http://localhost:3000",
        // credentials: false,
    })
);

app.use('/', apiLimiter, pageRouter);

app.use(sentryConfig.initErrorHandler);

app.use((req, res, next) => {
    const error = new Error(`${req.method} ${req.url} 라우터가 없습니다.`);
    error.status = 404;
    next(error);
});

app.use((err, req, res, next) => {
    res.locals.message = err.message;
    res.locals.error = process.env.NODE_ENV !== 'production' ? err : {};
    res.status(err.status || 500);
    logger.error(err);
    return res.json(sendErrorLog(err));
});

app.listen(app.get('port'), () => {
    console.log(app.get('port'), '번 포트에서 대기 중');
});
