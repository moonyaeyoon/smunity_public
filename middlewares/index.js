const { rateLimit } = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const { JWT_TOKEN_EXPIRED, JWT_TOKEN_WRONG, JWT_TOKEN_NOT_FOUND } = require('../constants/resErrorJson');

exports.verifyAToken = (req, res, next) => {
    if (!req.headers.authorization) return res.status(JWT_TOKEN_NOT_FOUND.status_code).json(JWT_TOKEN_NOT_FOUND.res_json);
    try {
        res.locals.decodes = jwt.verify(req.headers.authorization, process.env.JWT_SECRET);
        return next();
    } catch (error) {

        //logger.error(error);
        if (error.name === 'TokenExpiredError') {
            //유효 기간 초과
            return res.status(JWT_TOKEN_EXPIRED.status_code).json(JWT_TOKEN_EXPIRED.res_json);
        } else {
            //잘못된 토큰
            return res.status(JWT_TOKEN_WRONG.status_code).json(JWT_TOKEN_WRONG.res_json);
        }
    }
};

const LIMIT_SECOND = process.env.API_LIMIT_SECOND || 2;
const LIMIT_TIMES = process.env.API_LIMIT_TIMES || 1;

exports.apiLimiter = rateLimit({
    windowMs: 1000 * LIMIT_SECOND, // 괄호 안에 초/Second
    max: LIMIT_TIMES,
    handler(req, res) {
        res.status(429).json({
            code: 429,
            message: `${LIMIT_SECOND}초 안에 ${LIMIT_TIMES}번만 접속할 수 있습니다.`,
        });
    },
});
