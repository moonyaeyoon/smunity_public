const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const RES_ERROR_JSON = require('../../constants/resErrorJson');
const SMU_STUDENT_EMAIL_DOMAIN = process.env.SMU_STUDENT_EMAIL_DOMAIN;
const PASSWORD_SALT_OR_ROUNDS = process.env.PASSWORD_SALT_OR_ROUNDS;
const nodemailer = require('nodemailer');
const aws = require('aws-sdk');
const ejs = require('ejs');

const User = require('../../models/user');
const Major = require('../../models/major');
const Board = require('../../models/board');
const Post = require('../../models/post');
const UserLikePost = require('../../models/UserLikePost');
const jwtUtil = require('../../util/jwtUtil');
const {
    getSuccessSignInJson,
    GET_NEW_ACCESS_TOKEN_STATUS,
    getNewAccessTokenJson,
    USER_SIGNIN_SUCCESS_STATUS,
    USER_CAN_SIGNUP,
    ADD_USER_SUCCESS,
    emailAuthSuccess,
    EDIT_USER_NICKNAME,
    EDIT_USER_PROFILE_IMAGE,
    DELETE_USER_SUCCESS,
    CHANGE_PASSWORD_SUCCESS,
    FIND_PASSWORD_SUCCESS,
    EDIT_USER_MBTI,
    EDIT_USER_TIME_TABLE,
} = require('../../constants/resSuccessJson');
const { UserMajor } = require('../../models');
const { encrypt, decrypt } = require('../../util/crypter');
const { imageRemover } = require('../image/ImageUploader');
const logger = require('../../config/winstonConfig');

const checkSchoolIdExist = async (schoolId) => {
    const EX_USER = await User.findOne({ where: { school_id: schoolId } });
    if (EX_USER) return EX_USER;
    else return null;
};

const checkUserExistByUserId = async (userId) => {
    const REQ_USER = await User.findOne({
        where: {
            id: userId,
        },
    });
    //사용자 미존재
    if (REQ_USER === null) return false;
    else return REQ_USER;
};

const generateRandomCode = (digit) => {
    let randomNumberCode = '';
    for (let i = 0; i < digit; i++) {
        randomNumberCode += Math.floor(Math.random() * 10);
    }
    return randomNumberCode;
};

const generateAuthUrl = (schoolId, randomCode) => {
    //이메일 인증을 위한 링크 생성 -> 암호화 필수
    const AUTH_QUERY = `${schoolId}&&${randomCode}`;
    const CRYPTED_QUERY = encrypt(AUTH_QUERY, process.env.AUTH_QUERY_SECRET_KEY);
    const ENCODED_QUERY = encodeURIComponent(CRYPTED_QUERY);
    console.log('encoded query: ', ENCODED_QUERY);

    const LINK_DOMAIN = process.env.NODE_ENV == 'test' ? 'http://localhost:8001' : process.env.EMAIL_AUTH_DOMAIN;

    return `${LINK_DOMAIN}/auth/auth_email?code=${ENCODED_QUERY}`;
};

exports.checkSchoolId = async (req, res, next) => {
    try {
        if (!req.headers.school_id) {
            return res.status(RES_ERROR_JSON.REQ_FORM_ERROR.status_code).json(RES_ERROR_JSON.REQ_FORM_ERROR.res_json);
        }

        const USER_INFO = await checkSchoolIdExist(req.headers.school_id);
        if (USER_INFO === null) {
            return res.status(USER_CAN_SIGNUP.status_code).json(USER_CAN_SIGNUP.res_json);
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
    let image = req.body.image;
    try {
        if (!school_id || !nickname || !password) {
            return res.status(RES_ERROR_JSON.REQ_FORM_ERROR.status_code).json(RES_ERROR_JSON.REQ_FORM_ERROR.res_json);
        }

        //비번 버그 수정
        console.log('회원가입 요청 id: ' + school_id + ', 닉네임: ' + nickname + ', 비번: ' + password);

        const EX_USER = await checkSchoolIdExist(school_id);
        if (EX_USER) {
            return res.status(RES_ERROR_JSON.USER_EXISTS.status_code).json(RES_ERROR_JSON.USER_EXISTS.res_json);
        }
        //프사 지정안하면 기본프사 url 할당
        if (image === null || image === '') {
            console.log('no image');
            image = process.env.DEFAULT_PROFILE_IMAGE;
        }
        const NEW_USER_EMAIL = `${school_id}@${SMU_STUDENT_EMAIL_DOMAIN}`;
        const NEW_USER_PASSWORD_HASH = await bcrypt.hash(password, Number(PASSWORD_SALT_OR_ROUNDS));
        console.log('passwod hash is: ' + NEW_USER_PASSWORD_HASH + ', and the password is: ' + password);

        //이메일 인증을 위한 랜덤 코드 생성
        const AUTH_CODE = generateRandomCode(10);

        //이메일 인증을 위한 링크 생성 -> 암호화 필수
        const AUTH_URL = generateAuthUrl(school_id, AUTH_CODE);

        //이메일 보내기 => 테스트할 때는 해당 링크를 서버에 log남기기
        sendAuthMailing(AUTH_URL, school_id);
        console.log(`Sign Up: 인증 링크: ${AUTH_URL}`);

        const NEW_USER = await User.create({
            school_id: school_id,
            email: NEW_USER_EMAIL,
            nickname,
            password: NEW_USER_PASSWORD_HASH,
            email_auth_code: AUTH_CODE,
            profile_img_url: image,
        });
        // ADD_USER_SUCCESS.res_json.auth_url = AUTH_URL;
        ADD_USER_SUCCESS.res_json.profile_img_url = image;
        logger.info(`회원 가입 성공: {학번:${school_id}, 인증 링크:${AUTH_URL}}`);
        return res.status(ADD_USER_SUCCESS.status_code).json(ADD_USER_SUCCESS.res_json);
    } catch (error) {
        logger.error(`회원 가입 에러: {학번: ${school_id}, 에러문: ${error}}`);
        return next(error);
    }
};

exports.login = async (req, res, next) => {
    const { school_id, password } = req.body;
    try {
        if (!school_id || !password)
            //요청 양식 틀림
            return res.status(RES_ERROR_JSON.REQ_FORM_ERROR.status_code).json(RES_ERROR_JSON.REQ_FORM_ERROR.res_json);

        console.log('로그인 요청 id: ' + school_id + ', 비번: ' + password);
        const USER_INFO = await checkSchoolIdExist(school_id); //사용자 미존재
        if (USER_INFO === null) {
            console.log('Login Error: school donot exist');
            return res.status(RES_ERROR_JSON.SIGN_IN_ERROR.status_code).json(RES_ERROR_JSON.SIGN_IN_ERROR.res_json);
        }

        if (USER_INFO.password === null) {
            console.log('Login Error: user signup by third part');
            return res.status(RES_ERROR_JSON.SIGN_IN_ERROR.status_code).json(RES_ERROR_JSON.SIGN_IN_ERROR.res_json);
        }
        //local로 회원가입한 사람이 이닐 경우

        //비번 버그 수정
        const NEW_USER_PASSWORD_HASH = await bcrypt.hash(password, Number(PASSWORD_SALT_OR_ROUNDS));
        console.log('입력한 비번은' + password + '이고, 해싱된 데이터가: ' + NEW_USER_PASSWORD_HASH + '이다.');

        //비번 해싱하고 DB와 비교하기
        const PASSWORD_COMPARE_RESULT = await bcrypt.compare(password, USER_INFO.password);
        if (PASSWORD_COMPARE_RESULT) {
            //비번 일치 시 전공이 비어 있는지 확인 -> 비어 있으면 아직 인증 못한 상태임.
            const USER_MAJOR_INFO = await UserMajor.findOne({ where: { user_id: USER_INFO.id } });
            if (!USER_MAJOR_INFO)
                return res.status(RES_ERROR_JSON.EMAIL_AUTH_ERROR.status_code).json(RES_ERROR_JSON.EMAIL_AUTH_ERROR.res_json);
            const aToken = jwtUtil.signAToken(USER_INFO.id);
            const rToken = await jwtUtil.signRToken(USER_INFO.id);
            return res
                .status(USER_SIGNIN_SUCCESS_STATUS)
                .json(getSuccessSignInJson(USER_INFO.id, aToken, rToken.resfreshToken, rToken.expirationDateTime));
        } else {
            //비번 불일치
            console.log('Login Error: password error');
            return res.status(RES_ERROR_JSON.SIGN_IN_ERROR.status_code).json(RES_ERROR_JSON.SIGN_IN_ERROR.res_json);
        }
    } catch (error) {
        logger.error(`로그인 에러: {학번: ${school_id}, 에러문: ${error}}`);
        return next(error);
    }
};

exports.refreshAToken = async (req, res, next) => {
    if (!req.headers.access_token || !req.headers.refresh_token)
        return res.status(RES_ERROR_JSON.REQ_FORM_ERROR.status_code).json(RES_ERROR_JSON.REQ_FORM_ERROR.res_json);
    try {
        //aToken 디코딩 => UserId 확인
        const NOW_USER_INFO = jwt.decode(req.headers.access_token);

        //TODO: 토큰이 아닌 일반적인 문자열이 들어오면 예외처리해줘야 함.

        //rToken 인증(rToken도 유효 기간 지날 수 있으니까)
        const RTOKEN_STATUS = await jwtUtil.verifyRToken(req.headers.refresh_token, NOW_USER_INFO.user_id);
        if (RTOKEN_STATUS) {
            //rToken유효
            const NEW_ATOKEN = jwtUtil.signAToken(NOW_USER_INFO.user_id);
            return res.status(GET_NEW_ACCESS_TOKEN_STATUS).json(getNewAccessTokenJson(NEW_ATOKEN));
        } else {
            //rToken무효
            return res.status(RES_ERROR_JSON.JWT_REFRESH_TOKEN_EXPIRED.status_code).json(RES_ERROR_JSON.JWT_REFRESH_TOKEN_EXPIRED.res_json);
        }
    } catch (error) {
        logger.error(`토큰 재발급 에러: {에러문: ${error}}`);
        return next(error);
    }
};

exports.getUserMajors = async (req, res, next) => {
    try {
        const USER_MAJORS_INFO = await UserMajor.findAll({ where: { user_id: res.locals.decodes.user_id } });
        const RES_MAJOR_LIST = [];
        for (let index = 0; index < USER_MAJORS_INFO.length; index++) {
            const NOW_USER_MAJOR = USER_MAJORS_INFO[index];
            const MAJOR_INFO = await Major.findOne({ where: { id: NOW_USER_MAJOR.major_id } });

            const BOARDS_INFO = await Board.findAll({ where: { major_id: MAJOR_INFO.id } });
            let freeBoardID = 1;
            for (let boardIdx = 0; boardIdx < BOARDS_INFO.length; boardIdx++) {
                const NOW_BOARD_INFO = BOARDS_INFO[boardIdx];
                if (NOW_BOARD_INFO.board_name.split('-')[1] === '자유게시판') {
                    freeBoardID = NOW_BOARD_INFO.id;
                    break;
                }
            }

            RES_MAJOR_LIST.push({
                major_id: NOW_USER_MAJOR.major_id,
                major_name: MAJOR_INFO.major_name,
                free_board_id: freeBoardID,
            });
        }
        res.status(200).json(RES_MAJOR_LIST);
    } catch (error) {
        return next(error);
    }
};

exports.addSchoolAuth = async (req, res, next) => {
    try {
        if (!req.query.code) {
            console.log('Email Auth Error: 요청양식 틀림');
            return res.status(404).send(RES_ERROR_JSON.emailAuthError());
        }

        const DECODED_CODE = decodeURIComponent(req.query.code);
        const AUTH_QUERY_ARRAY = decrypt(DECODED_CODE, process.env.AUTH_QUERY_SECRET_KEY).split('&&');
        const URL_SCHOOL_ID = AUTH_QUERY_ARRAY[0];
        const URL_AUTH_CODE = AUTH_QUERY_ARRAY[1];

        const REQ_USER = await checkSchoolIdExist(URL_SCHOOL_ID);
        if (!REQ_USER) {
            console.log('Email Auth Error: 사용자 존재하지 않음');
            return res.status(404).send(RES_ERROR_JSON.emailAuthError());
        }

        if (REQ_USER.email_auth_code == URL_AUTH_CODE) {
            await UserMajor.create({
                user_id: REQ_USER.id,
                major_id: 1,
            });
            await REQ_USER.update({ email_auth_code: 'finish' });
            logger.info(`이메일 인증 성공: {학번: ${REQ_USER.school_id}}`);
            return res.status(201).send(emailAuthSuccess());
        } else if (REQ_USER.email_auth_code == 'finish') {
            console.log(`Email Auth Error: 이미 인증된 링크 -> 링크: ${URL_AUTH_CODE}, 서버: ${REQ_USER.email_auth_code}`);
            return res.status(401).send(RES_ERROR_JSON.alreadyAuth());
        } else {
            console.log(`Email Auth Error: 인증코드 일치하지 않음 -> 링크: ${URL_AUTH_CODE}, 서버: ${REQ_USER.email_auth_code}`);
            return res.status(404).send(RES_ERROR_JSON.emailAuthError());
        }
    } catch (error) {
        logger.error(`이메일 인증 에러: {에러문: ${error}}}`);
        return res.status(404).send(RES_ERROR_JSON.emailAuthError());
    }
};

exports.getUserInfo = async (req, res, next) => {
    try {
        const USER_MAJORS_INFO = await UserMajor.findAll({ where: { user_id: res.locals.decodes.user_id } });
        const RES_MAJOR_LIST = [];
        for (let index = 0; index < USER_MAJORS_INFO.length; index++) {
            const NOW_USER_MAJOR = USER_MAJORS_INFO[index];
            const MAJOR_INFO = await Major.findOne({ where: { id: NOW_USER_MAJOR.major_id } });

            const BOARDS_INFO = await Board.findAll({ where: { major_id: MAJOR_INFO.id } });
            let freeBoardID = 1;
            for (let boardIdx = 0; boardIdx < BOARDS_INFO.length; boardIdx++) {
                const NOW_BOARD_INFO = BOARDS_INFO[boardIdx];
                if (NOW_BOARD_INFO.board_name.split('-')[1] === '자유게시판') {
                    freeBoardID = NOW_BOARD_INFO.id;
                    break;
                }
            }

            RES_MAJOR_LIST.push({
                major_id: NOW_USER_MAJOR.major_id,
                major_name: MAJOR_INFO.major_name,
                free_board_id: freeBoardID,
            });
        }

        const NOW_USER = await checkUserExistByUserId(res.locals.decodes.user_id);
        if (!NOW_USER) {
            return res.status(RES_ERROR_JSON.USER_NOT_EXIST.status_code).json(RES_ERROR_JSON.USER_NOT_EXIST.res_json);
        }
        const RES_USER_INFO = {
            username: NOW_USER.nickname,
            school_id: NOW_USER.school_id,
            profile_img_url: NOW_USER.profile_img_url || null,
            mbti: NOW_USER.mbti,
            majors: RES_MAJOR_LIST,
            time_table: NOW_USER.time_table,
        };
        res.status(200).json(RES_USER_INFO);
    } catch (error) {
        return next(error);
    }
};

exports.editUserNickName = async (req, res, next) => {
    try {
        // 로그인한 사용자 정보 가져오기
        const NOW_USER = await checkUserExistByUserId(res.locals.decodes.user_id);
        if (!NOW_USER) {
            return res.status(RES_ERROR_JSON.USER_NOT_EXIST.status_code).json(RES_ERROR_JSON.USER_NOT_EXIST.res_json);
        }

        // 사용자 닉네임 수정
        const nickname = req.body.nickname;
        await User.update({ nickname: nickname }, { where: { id: NOW_USER.id } });

        return res.status(EDIT_USER_NICKNAME.status_code).json(EDIT_USER_NICKNAME.res_json);
    } catch (error) {
        logger.error(`사용자 닉네임 수정 에러: {에러문: ${error}}`);
        next(error);
    }
};

exports.editUserProfileImage = async (req, res, next) => {
    try {
        // 로그인한 사용자 정보 가져오기
        const NOW_USER = await checkUserExistByUserId(res.locals.decodes.user_id);
        if (!NOW_USER) {
            return res.status(RES_ERROR_JSON.USER_NOT_EXIST.status_code).json(RES_ERROR_JSON.USER_NOT_EXIST.res_json);
        }

        //이미지 s3버킷에서 삭제하기
        await imageRemover(NOW_USER.profile_img_url);

        // 사용자 프로필 이미지 수정
        await User.update({ profile_img_url: req.body.image }, { where: { id: NOW_USER.id } });

        return res.status(EDIT_USER_PROFILE_IMAGE.status_code).json(EDIT_USER_PROFILE_IMAGE.res_json);
    } catch (error) {
        logger.error(`사용자 프로필 사진 수정 에러: {에러문: ${error}}`);
        next(error);
    }
};

exports.editUserTimeTable = async (req, res, next) => {
    try {
        // 로그인한 사용자 정보 가져오기
        const NOW_USER = await checkUserExistByUserId(res.locals.decodes.user_id);
        if (!NOW_USER) {
            return res.status(RES_ERROR_JSON.USER_NOT_EXIST.status_code).json(RES_ERROR_JSON.USER_NOT_EXIST.res_json);
        }

        //이미지 s3버킷에서 삭제하기
        await imageRemover(NOW_USER.time_table);

        // 사용자 프로필 이미지 수정
        await User.update({ time_table: req.body.time_table }, { where: { id: NOW_USER.id } });

        return res.status(EDIT_USER_TIME_TABLE.status_code).json(EDIT_USER_TIME_TABLE.res_json);
    } catch (error) {
        return next(error);
    }
};

exports.editUserMbti = async (req, res, next) => {
    try {
        // 로그인한 사용자 정보 가져오기
        const NOW_USER = await checkUserExistByUserId(res.locals.decodes.user_id);
        if (!NOW_USER) {
            return res.status(RES_ERROR_JSON.USER_NOT_EXIST.status_code).json(RES_ERROR_JSON.USER_NOT_EXIST.res_json);
        }
        const mbti = req.body.mbti;
        const validMbtiPattern = /^[EI][NS][FT][JP]$/i;

        if (validMbtiPattern.test(mbti)) {
            await User.update({ mbti: mbti }, { where: { id: NOW_USER.id } });
            return res.status(EDIT_USER_MBTI.status_code).json(EDIT_USER_MBTI.res_json);
        } else {
            return res.status(RES_ERROR_JSON.INVALID_MBTI.status_code).json(RES_ERROR_JSON.INVALID_MBTI.res_json);
        }
    } catch (error) {
        return next(error);
    }
};

exports.deleteUser = async (req, res, next) => {
    try {
        const EX_USER = await checkUserExistByUserId(res.locals.decodes.user_id);
        if (!EX_USER) {
            return res.status(RES_ERROR_JSON.USER_NOT_EXIST.status_code).json(RES_ERROR_JSON.USER_NOT_EXIST.res_json);
        }
        await imageRemover(EX_USER.profile_img_url);
        await EX_USER.destroy();
        logger.info(`회원 탈퇴 완료: {학번: ${EX_USER.school_id}}`);
        return res.status(DELETE_USER_SUCCESS.status_code).json(DELETE_USER_SUCCESS.res_json);
    } catch (error) {
        logger.error(`회원 탈퇴 에러: {에러문: ${error}}`);
        return next(error);
    }
};

exports.changePassword = async (req, res, next) => {
    try {
        const NOW_USER = await checkUserExistByUserId(res.locals.decodes.user_id);
        if (!NOW_USER) {
            return res.status(RES_ERROR_JSON.USER_NOT_EXIST.status_code).json(RES_ERROR_JSON.USER_NOT_EXIST.res_json);
        }
        const { old_password, new_password } = req.body;
        //요청양식 틀릴경우
        if (!old_password || !new_password) {
            console.log(`${old_password}`);
            return res.status(RES_ERROR_JSON.REQ_FORM_ERROR.status_code).json(RES_ERROR_JSON.REQ_FORM_ERROR.res_json);
        }

        const PASSWORD_COMPARE_RESULT = await bcrypt.compare(old_password, NOW_USER.password);
        //예전 비밀번호가 틀리면
        if (!PASSWORD_COMPARE_RESULT) {
            return res.status(RES_ERROR_JSON.WRONG_PASSWORD.status_code).json(RES_ERROR_JSON.WRONG_PASSWORD.res_json);
        }
        //비밀번호 변경
        const NEW_USER_PASSWORD_HASH = await bcrypt.hash(new_password, Number(PASSWORD_SALT_OR_ROUNDS));
        await User.update({ password: NEW_USER_PASSWORD_HASH }, { where: { id: NOW_USER.id } });
        return res.status(CHANGE_PASSWORD_SUCCESS.status_code).json(CHANGE_PASSWORD_SUCCESS.res_json);
    } catch (error) {
        return next(error);
    }
};

const sendAuthMailing = async (authUrl, schoolId) => {
    aws.config.update({
        accessKeyId: process.env.SES_AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SES_ACCESS_KEY,
        region: 'us-east-1',
    });
    const ses = new aws.SES({
        apiVersion: '2010-12-01',
    });

    let transporter = nodemailer.createTransport({
        SES: { ses, aws },
    });

    transporter.sendMail(
        {
            from: 'SMUS<sja3410@gmail.com>',
            to: `${schoolId}@sangmyung.kr`,
            subject: 'SMUS 회원가입 인증메일 입니다.',
            text: `해당 링크를 클릭하면 회원인증이 완료됩니다. ${authUrl}`,
        },
        (err, info) => {
            if (err) {
                console.log(err);
                return false;
            }
        }
    );
    return true;
};

exports.sendUserAuthLinkForTest = async (req, res, next) => {
    try {
        const REQ_SCHOOL_ID = req.headers.school_id;
        if (!REQ_SCHOOL_ID) {
            return res.status(RES_ERROR_JSON.USER_NOT_EXIST.status_code).json(RES_ERROR_JSON.USER_NOT_EXIST.res_json);
        }
        const REQ_USER = await checkSchoolIdExist(REQ_SCHOOL_ID);
        if (!REQ_USER) {
            console.log('Email Auth Error: 사용자 존재하지 않음');
            return res.status(401).json({
                message: '해당 사용자가 없습니다.',
            });
        }
        const AUTH_CODE = REQ_USER.email_auth_code;

        if (AUTH_CODE != 'finish') {
            const AUTH_URL = generateAuthUrl(REQ_USER.school_id, AUTH_CODE);
            res.status(200).json({
                message: AUTH_URL,
            });
        } else {
            res.status(402).json({
                message: '이미 인증된 링크입니다.',
            });
        }
    } catch (error) {
        return next(error);
    }
};

exports.getMyActivity = async (req, res, next) => {
    try {
        const NOW_USER = await checkUserExistByUserId(res.locals.decodes.user_id);
        if (!NOW_USER) {
            return res.status(RES_ERROR_JSON.USER_NOT_EXIST.status_code).json(RES_ERROR_JSON.USER_NOT_EXIST.res_json);
        }

        const posts = await Post.findAll({ where: { user_id: NOW_USER.id } });
        const post_id_list = [];
        
        for (let i = 0; i < posts.length; i++) {
            const post_obj = {
                post_id : posts[i].id,
                board_id : posts[i].board_id
            }
            post_id_list.push(post_obj);
        }
        const likes = await UserLikePost.findAll({ where: { user_id: NOW_USER.id } });
        const like_list = [];
        for (let i = 0; i < likes.length; i++) {
            const post = await Post.findAll({where: { id: likes[i].post_id}});
            const post_obj = {
                post_id : post.id,
                board_id : post.board_id
            }
            like_list.push(post_obj);
        }

        const RES_MY_ACTIVITY = {
            user_post: post_id_list,
            user_liked: like_list,
        };
        return res.status(200).json(RES_MY_ACTIVITY);
    } catch (error) {
        return next(error);
    }
};

exports.checkUserPassword = async (req, res, next) => {
    try {
        const NOW_USER = await checkUserExistByUserId(res.locals.decodes.user_id);
        if (!NOW_USER) {
            return res.status(RES_ERROR_JSON.USER_NOT_EXIST.status_code).json(RES_ERROR_JSON.USER_NOT_EXIST.res_json);
        }

        const school_id = req.body.school_id;
        const password = req.body.password;

        const user = await User.findOne({ where: { school_id: school_id } });
        if (!user) {
            return res.status(RES_ERROR_JSON.USER_NOT_EXIST.status_code).json(RES_ERROR_JSON.USER_NOT_EXIST.res_json);
        }

        const PASSWORD_COMPARE_RESULT = await bcrypt.compare(password, user.password);

        if (PASSWORD_COMPARE_RESULT) {
            return res.status(200).json({ result: true });
        } else {
            return res.status(403).json({ result: false });
        }
    } catch (error) {
        return next(error);
    }
};

exports.findPassword = async (req, res, next) => {
    try {
        if (!req.body.school_id) {
            return res.status(RES_ERROR_JSON.REQ_FORM_ERROR.status_code).json(RES_ERROR_JSON.REQ_FORM_ERROR.res_json);
        }

        const USER = await User.findOne({
            where: {
                school_id: req.body.school_id,
            },
        });
        if (!USER) {
            return res.status(RES_ERROR_JSON.USER_NOT_EXIST.status_code).json(RES_ERROR_JSON.USER_NOT_EXIST.res_json);
        }

        const new_password = generateRandomCode(8);

        const NEW_PASSWORD_HASH = await bcrypt.hash(new_password, Number(PASSWORD_SALT_OR_ROUNDS));

        await User.update({ password: NEW_PASSWORD_HASH }, { where: { school_id: req.body.school_id } });

        aws.config.update({
            accessKeyId: process.env.SES_AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SES_ACCESS_KEY,
            region: 'us-east-1',
        });
        const ses = new aws.SES({
            apiVersion: '2010-12-01',
        });

        let transporter = nodemailer.createTransport({
            SES: { ses, aws },
        });

        transporter.sendMail(
            {
                from: 'SMUS<sja3410@gmail.com>',
                to: `${req.body.school_id}@sangmyung.kr`,
                subject: 'SMUS 임시비밀번호 발급 안내',
                text: `임시 비밀번호: ${new_password}`,
            },
            (err, info) => {
                if (err) {
                    console.log(err);
                    return false;
                }
            }
        );
        logger.info(new_password);
        return res.status(FIND_PASSWORD_SUCCESS.status_code).json(FIND_PASSWORD_SUCCESS.res_json);
    } catch (error) {
        return next(error);
    }
};
