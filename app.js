const express = require('express');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const path = require('path');
const session = require('express-session');
const nunjucks = require('nunjucks');
const dotenv = require('dotenv');
const passport = require('passport');
const passportConfig = require('./passport');
const { createClient } = require('redis');

dotenv.config();
const pageRouter = require('./routes/page');
const { sequelize } = require('./models');

const { resetDB } = require('./reset/resetDB');

const app = express();
passportConfig();
app.set('port', process.env.PORT || 8001);
app.set('view engine', 'html');
nunjucks.configure('views', {
    express: app,
    watch: true,
});

// const IS_RESET_DB = process.argv[2] | "false";
let isResetDB = false;
if (process.argv[2] === 'reset') isResetDB = true;

sequelize
    .sync({ force: isResetDB })
    .then(async () => {
        console.log('데이터베이스 연결 성공');
        if (isResetDB) resetDB();
    })
    .catch((err) => {
        console.error(err);
    });

app.use(morgan('dev'));
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

app.use(passport.initialize());
app.use(passport.session());

const cors = require('cors');
app.use(
    cors({
        // origin: "http://localhost:3000",
        // credentials: false,
    })
);

const client = createClient();
client.on('error', (err) => console.log('redis Error', err));

app.use('/', pageRouter);

app.use((req, res, next) => {
    const error = new Error(`${req.method} ${req.url} 라우터가 없습니다.`);
    error.status = 404;
    next(error);
});

app.use((err, req, res, next) => {
    res.locals.message = err.message;
    res.locals.error = process.env.NODE_ENV !== 'production' ? err : {};
    res.status(err.status || 500);
    console.log(err);
    res.render('error');
});

app.listen(app.get('port'), () => {
    console.log(app.get('port'), '번 포트에서 대기 중');
});
