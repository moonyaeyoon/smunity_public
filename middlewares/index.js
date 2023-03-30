const jwt = require('jsonwebtoken');
const { JWT_TOKEN_EXPIRED, JWT_TOKEN_WRONG, JWT_TOKEN_NOT_FOUND } = require('../constants/resErrorJson');

exports.verifyAToken = (req, res, next) => {
    if (!req.headers.authorization) return res.status(JWT_TOKEN_NOT_FOUND.status_code).json(JWT_TOKEN_NOT_FOUND.res_json);
    try {
        res.locals.decodes = jwt.verify(req.headers.authorization, process.env.JWT_SECRET);
        return next();
    } catch (error) {
        console.error(error);
        if (error.name === 'TokenExpiredError') {
            //유효 기간 초과
            return res.status(JWT_TOKEN_EXPIRED.status_code).json(JWT_TOKEN_EXPIRED.res_json);
        } else {
            //잘못된 토큰
            return res.status(JWT_TOKEN_WRONG.status_code).json(JWT_TOKEN_WRONG.res_json);
        }
    }
};
