const jwt =require('jsonwebtoken')
const { JWT_TOKEN_EXPIRED, JWT_TOKEN_INVALID, JWT_TOKEN_NOT_FOUND } = require('../constants/resErrorJson');

// exports.isLoggedIn = (req, res, next) => {
//     if (req.isAuthenticated()) {
//         next();
//     } else {
//         res.status(403).json({
//             code: 403,
//             message: '로그아웃된 상태입니다.',
//         });
//     }
// };

// exports.isNotLoggedIn = (req, res, next) => {
//     if (!req.isAuthenticated()) {
//         next();
//     } else {
//         res.status(403).json({
//             code: 403,
//             message: '로그인된 상태입니다.',
//         });
//     }
// };

exports.verifyAToken = (req, res, next) => {
    if(!req.headers.authorization) return res.status(JWT_TOKEN_NOT_FOUND.status_code).json(JWT_TOKEN_NOT_FOUND.res_json)
    try {
        res.locals.decodes = jwt.verify(req.headers.authorization, process.env.JWT_SECRET);
        return next();
    } catch (error) {
        console.error(error)
        if (error.name === 'TokenExpiredError') {
            //유효 기간 초과
            return res.status(JWT_TOKEN_EXPIRED.status_code).json(JWT_TOKEN_EXPIRED.res_json);
        } else {
            //유효하지 않는 토큰
            return res.status(JWT_TOKEN_INVALID.status_code).json(JWT_TOKEN_INVALID.res_json);
        }
    }
};
