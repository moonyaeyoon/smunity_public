const { rateLimit } = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const { JWT_TOKEN_EXPIRED, JWT_TOKEN_WRONG, JWT_TOKEN_NOT_FOUND } = require('../constants/resErrorJson');
const mixpanel = require('mixpanel');
const User = require('../models/user');
const UserMajor = require('../models/UserMajor');
const Major = require('../models/major');

const mixpanelClient = mixpanel.init(process.env.MIXPANEL_PROJECT_TOKEN);

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

exports.trackEvent = async(req, res, next) => {
    //Mixpanel
    
    const api = req.originalUrl;
    const userID = res.locals.decodes.user_id;
    
    const NOW_USER = await User.findOne({ where : { id: userID}});
    const NOW_USER_MAJOR_LIST = await UserMajor.findAll({ where: { user_id: NOW_USER.id } });

    let major_list = "";
    for(let i =0; i < NOW_USER_MAJOR_LIST.length; i++){
        const major_id = NOW_USER_MAJOR_LIST[i].major_id;
        const major = await Major.findOne({ where: { id: major_id }});
        major_list += major.major_name + " ";
    }
    const school_id = NOW_USER.school_id;
    const name = NOW_USER.nickname;

    mixpanelClient.people.set(school_id, {
        Nickname: name,
        Major: major_list
    });

    
    mixpanelClient.track(api, {
        distinct_id: school_id
    });
    next();
};
