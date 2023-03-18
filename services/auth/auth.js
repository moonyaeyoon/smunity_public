const bcrypt = require('bcrypt');
const passport = require('passport');
const RES_ERROR_JSON = require('../../constants/resErrorJson');
const SMU_STUDENT_EMAIL_DOMAIN = process.env.SMU_STUDENT_EMAIL_DOMAIN;
const PASSWORD_SALT_OR_ROUNDS = process.env.PASSWORD_SALT_OR_ROUNDS;

const User = require('../../models/user');
const Major = require('../../models/major');
const Board = require('../../models/board');

exports.checkSchoolId = async (req, res, next) => {
    try {
        if (!req.headers.school_id) {
            return res.status(RES_ERROR_JSON.REQ_FORM_ERROR.status_code).json(RES_ERROR_JSON.REQ_FORM_ERROR.res_json);
        }

        const EX_USER = await User.findOne({ where: { schoolId: req.headers.school_id } });
        if (EX_USER) {
            return res.status(RES_ERROR_JSON.USER_EXISTS.status_code).json(RES_ERROR_JSON.USER_EXISTS.res_json);
        } else {
            return res.status(RES_ERROR_JSON.USER_NOT_EXISTS.status_code).json(RES_ERROR_JSON.USER_NOT_EXISTS.res_json);
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
    try {
        // console.log(req);
        passport.authenticate('local', (authError, user, info) => {
            if (authError) {
                console.error(authError);
                return next(authError);
            }
            if (!user) {
                if (info.message == 'Missing credentials') {
                    return res.status(401).json({
                        code: 401,
                        message: info.message,
                    });
                }
                return res.status(400).json({
                    code: 400,
                    message: info.message,
                });
            }
            return req.login(user, async (loginError) => {
                if (loginError) {
                    console.error(loginError);
                    return next(loginError);
                }
                console.log(user.email);
                const alist = await user.getMajors();
                console.log('cookie: ' + req.headers.cookie);
                // res.setHeader("Access-Control-Allow-Credentials", true);
                res.status(200)
                    .json({
                        code: 200,
                        message: '로그인 성공',
                        nickname: user.nick,
                        email: user.email,
                        // saveCookie: await res.headers.cookie,
                        majorlist: alist,
                    })
                    .send();
            });
        })(req, res, next);
    } catch (error) {
        console.error(error);
        next(error);
    }
};

exports.logout = (req, res) => {
    req.logout(() => {
        res.status(200).json({
            code: 200,
            message: '로그아웃 성공',
        });
    });
};
