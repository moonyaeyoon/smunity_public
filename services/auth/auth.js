const bcrypt = require('bcrypt');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const RES_ERROR_JSON = require('../../constants/resErrorJson');
const SMU_STUDENT_EMAIL_DOMAIN = process.env.SMU_STUDENT_EMAIL_DOMAIN;
const PASSWORD_SALT_OR_ROUNDS = process.env.PASSWORD_SALT_OR_ROUNDS;

const User = require('../../models/user');
const Major = require('../../models/major');
const Board = require('../../models/board');
const jwtUtil = require('../../util/jwtUtil');
const {
    getSuccessSignInJson,
    GET_NEW_ACCESS_TOKEN_STATUS,
    getNewAccessTokenJson,
    USER_SIGNIN_SUCCESS_STATUS,
} = require('../../constants/resSuccessJson');

const checkSchoolIdExist = async (schoolId) => {
    const EX_USER = await User.findOne({ where: { schoolId: schoolId } });
    if (EX_USER) return EX_USER;
    else return null;
};

exports.checkSchoolId = async (req, res, next) => {
    try {
        if (!req.headers.school_id) {
            return res.status(RES_ERROR_JSON.REQ_FORM_ERROR.status_code).json(RES_ERROR_JSON.REQ_FORM_ERROR.res_json);
        }

        const USER_INFO = await checkSchoolIdExist(req.headers.school_id);
        if (USER_INFO === null) {
            return res.status(RES_ERROR_JSON.USER_CAN_SIGNUP.status_code).json(RES_ERROR_JSON.USER_CAN_SIGNUP.res_json);
        } else {
            return res.status(RES_ERROR_JSON.USER_EXISTS.status_code).json(RES_ERROR_JSON.USER_EXISTS.res_json);
        }
    } catch (err) {
        console.error(err);
        next(err);
    }
};

exports.join = async (req, res, next) => {
    const { school_id, nickname, password } = req.body;
    try {
        if (!school_id || !nickname || !password) {
            return res.status(RES_ERROR_JSON.REQ_FORM_ERROR.status_code).json(RES_ERROR_JSON.REQ_FORM_ERROR.res_json);
        }

        const EX_USER = await User.findOne({ where: { schoolId: school_id } });
        if (EX_USER) {
            return res.status(RES_ERROR_JSON.USER_EXISTS.status_code).json(RES_ERROR_JSON.USER_EXISTS.res_json);
        }

        const NEW_USER_EMAIL = `${school_id}@${SMU_STUDENT_EMAIL_DOMAIN}`;
        const NEW_USER_PASSWORD_HASH = await bcrypt.hash(password, Number(PASSWORD_SALT_OR_ROUNDS));
        console.log('passwod hash is: ' + NEW_USER_PASSWORD_HASH);
        const NEW_USER = await User.create({
            schoolId: school_id,
            email: NEW_USER_EMAIL,
            nickname,
            password: NEW_USER_PASSWORD_HASH,
        });

        return res.status(RES_ERROR_JSON.ADD_USER_SUCCESS.status_code).json(RES_ERROR_JSON.ADD_USER_SUCCESS.res_json);
    } catch (error) {
        console.error(error);
        return next(error);
    }
};

exports.login = async (req, res, next) => {
    const { school_id, password } = req.body;
    try {
        if (!school_id || !password)
            //요청 양식 틀림
            return res.status(RES_ERROR_JSON.REQ_FORM_ERROR.status_code).json(RES_ERROR_JSON.REQ_FORM_ERROR.res_json);

        const USER_INFO = await checkSchoolIdExist(school_id); //사용자 미존재
        if (USER_INFO === null) return res.status(RES_ERROR_JSON.SIGN_IN_ERROR.status_code).json(RES_ERROR_JSON.SIGN_IN_ERROR.res_json);

        if (USER_INFO.password === null)
            //local로 회원가입한 사람이 이닐 경우
            return res.status(RES_ERROR_JSON.SIGN_IN_ERROR.status_code).json(RES_ERROR_JSON.SIGN_IN_ERROR.res_json);

        //비번 해싱하고 DB와 비교하기
        const PASSWORD_COMPARE_RESULT = await bcrypt.compare(password, USER_INFO.password);
        if (PASSWORD_COMPARE_RESULT) {
            //비번 일치
            const aToken = jwtUtil.signAToken(USER_INFO.id);
            const rToken = await jwtUtil.signRToken(USER_INFO.id);
            return res.status(USER_SIGNIN_SUCCESS_STATUS).json(getSuccessSignInJson(aToken, rToken));
        } else {
            //비번 불일치
            return res.status(RES_ERROR_JSON.SIGN_IN_ERROR.status_code).json(RES_ERROR_JSON.SIGN_IN_ERROR.res_json);
        }
    } catch (error) {
        console.error(error);
        next(error);
    }
};

exports.refreshAToken = async (req, res, next) => {
    if (!req.headers.access_token || !req.headers.refresh_token)
        return res.status(RES_ERROR_JSON.REQ_FORM_ERROR.status_code).json(RES_ERROR_JSON.REQ_FORM_ERROR.res_json);
    try {
        //aToken 디코딩 => UserId 확인
        const NOW_USER_INFO = jwt.decode(req.headers.access_token);

        if (NOW_USER_INFO.user_id === null)
            //이상한 토큰(무효 토큰)
            return res.status(RES_ERROR_JSON.JWT_TOKEN_INVALID.status_code).json(RES_ERROR_JSON.JWT_TOKEN_INVALID.res_json);

        //rToken 인증(rToken도 유효 기간 지날 수 있으니까)
        const RTOKEN_STATUS = await jwtUtil.verifyRToken(req.headers.refresh_token, NOW_USER_INFO.user_id);
        if (RTOKEN_STATUS) {
            //rToken유효
            const NEW_ATOKEN = jwtUtil.signAToken(NOW_USER_INFO.user_id);
            return res.status(GET_NEW_ACCESS_TOKEN_STATUS).json(getNewAccessTokenJson(NEW_ATOKEN));
        } else {
            //rToken무효
            return res.status(RES_ERROR_JSON.JWT_TOKEN_EXPIRED.status_code).json(RES_ERROR_JSON.JWT_TOKEN_EXPIRED.res_json);
        }
    } catch (error) {
        console.error(error);
    }
};
