const { rateLimit } = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const { JWT_TOKEN_EXPIRED, JWT_TOKEN_WRONG, JWT_TOKEN_NOT_FOUND } = require('../constants/resErrorJson');
const mixpanel = require('mixpanel');
const User = require('../models/user');
const UserMajor = require('../models/UserMajor');
const Major = require('../models/major');
const { decrypt } = require('../util/crypter');

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
    
    let api = req.originalUrl;
    let school_id;

    // case 1: 회원가입했을 경우(회원정보는 받아올 수 있지만 로그인 상태로 api를 호출하지 않음)
    if(api === '/auth/join'){
        school_id = req.body.school_id;
        const name = req.body.name;

        if(!name || !school_id){
            next();
        }

        mixpanelClient.people.set(school_id, {
            Nickname: name,
            Major: 'Not yet'
        });
    }

    // case 2: 로그인했을 경우
    else if(api === '/auth/login'){
        school_id = req.body.school_id;
        
        const NOW_USER = await User.findOne({ where : { school_id: school_id}});
        if(!NOW_USER){
            next();
        }
        const NOW_USER_MAJOR_LIST = await UserMajor.findAll({ where: { user_id: NOW_USER.id } });

        const name = NOW_USER.nickname;

        let major_list = "";
        for(let i =0; i < NOW_USER_MAJOR_LIST.length; i++){
            const major_id = NOW_USER_MAJOR_LIST[i].major_id;
            const major = await Major.findOne({ where: { id: major_id }});
            major_list += major.major_name + " ";
        }

        mixpanelClient.people.set(school_id, {
            Nickname: name,
            Major: major_list
        });
    }

    //case 3: 이메일 인증을 했을 경우
    else if(api.match(/^\/auth\/auth_email\?.*$/)){
        
        const DECODED_CODE = decodeURIComponent(req.query.code);
        const AUTH_QUERY_ARRAY = decrypt(DECODED_CODE, process.env.AUTH_QUERY_SECRET_KEY).split('&&');
        const URL_SCHOOL_ID = AUTH_QUERY_ARRAY[0];

        school_id = URL_SCHOOL_ID;
        const NOW_USER = await User.findOne({ where : { school_id: school_id}});
        if(!NOW_USER){
            next();
        }

        mixpanelClient.people.set(school_id, {
            Nickname: NOW_USER.nickname,
            Major: 'Not yet'
        });

        //email code 다 개인마다 다르기때문에 다른이벤트로 수집하는 문제 해결
        api = '/auth/auth_email';

    }


    // case 4: 로그인하지 않고 api호출하지만 사용자 정보를 얻을 수 없음(현재 이 경우는 없어요 단순 조회에는 믹스패널을 안붙여놔서)
    else if(res.locals === undefined){
        mixpanelClient.people.set('Non-member', {
            Nickname: 'Non-member',
            Major: 'No major'
        });
        school_id = 'Non-user';
    }
    // case 5: 로그인한 사용자가 api호출 하는 경우
    else{
        const userID = res.locals.decodes.user_id;
        if(!userID){
            next();
        }
    
        const NOW_USER = await User.findOne({ where : { id: userID}});
        if(!NOW_USER){
            next();
        }

        const NOW_USER_MAJOR_LIST = await UserMajor.findAll({ where: { user_id: NOW_USER.id } });

        let major_list = "";
        for(let i =0; i < NOW_USER_MAJOR_LIST.length; i++){
            const major_id = NOW_USER_MAJOR_LIST[i].major_id;
            const major = await Major.findOne({ where: { id: major_id }});
            major_list += major.major_name + " ";
        }
        school_id = NOW_USER.school_id;
        const name = NOW_USER.nickname;

        mixpanelClient.people.set(school_id, {
            Nickname: name,
            Major: major_list
        });
    }

    
    mixpanelClient.track(api, {
        distinct_id: school_id
    });
    next();
};
