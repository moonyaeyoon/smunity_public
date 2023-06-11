const express = require('express');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const path = require('path');
const session = require('express-session');
const nunjucks = require('nunjucks');
const dotenv = require('dotenv');

dotenv.config();
const pageRouter = require('./routes/page');
const { sequelize } = require('./models');

const { resetDB } = require('./reset/resetDB');

const app = express();

//SENTRY
const Sentry = require('@sentry/node');
Sentry.init({
    dsn: 'https://17e09c44367c451ebbf4cab8568721f5@o4505250218180608.ingest.sentry.io/4505250221981696',
    integrations: [
        // enable HTTP calls tracing
        new Sentry.Integrations.Http({ tracing: true }),
        // enable Express.js middleware tracing
        new Sentry.Integrations.Express({ app }),
        // Automatically instrument Node.js libraries and frameworks
        ...Sentry.autoDiscoverNodePerformanceMonitoringIntegrations(),
    ],

    // Set tracesSampleRate to 1.0 to capture 100%
    // of transactions for performance monitoring.
    // We recommend adjusting this value in production
    tracesSampleRate: 1.0,
});

// RequestHandler creates a separate execution context, so that all
// transactions/spans/breadcrumbs are isolated across requests
app.use(Sentry.Handlers.requestHandler());
// TracingHandler creates a trace for every incoming request
app.use(Sentry.Handlers.tracingHandler());

//SENTRY END

app.set('views', './public/views'); // New!!
app.set('view engine', 'ejs'); // New!!
app.set('port', process.env.PORT || 8001);
app.set('view engine', 'html');
nunjucks.configure('views', {
    express: app,
    watch: true,
});

// const IS_RESET_DB = process.argv[2] | "false";
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

const cors = require('cors');
const { sendErrorLog } = require('./constants/resErrorJson');
const { apiLimiter } = require('./middlewares');
app.use(
    cors({
        // origin: "http://localhost:3000",
        // credentials: false,
    })
);

app.use('/', apiLimiter, pageRouter);

// The error handler must be before any other error middleware and after all controllers
app.use(Sentry.Handlers.errorHandler());

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
    return res.json(sendErrorLog(err));
});

app.listen(app.get('port'), () => {
    console.log(app.get('port'), '번 포트에서 대기 중');
});
