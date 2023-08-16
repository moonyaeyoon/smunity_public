const jwt = require('jsonwebtoken');
const { where } = require('sequelize');
const User = require('../models/user');
const moment = require('moment');

module.exports = {
    signAToken: (userId) => {
        const payload = {
            user_id: userId,
        };
        return jwt.sign(payload, process.env.JWT_SECRET, {
            algorithm: process.env.JWT_SIGN_ALGORITHM,
            expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRESIN,
        });
    },

    signRToken: async (userId) => {
        const expiresIn = process.env.JWT_REFRESH_TOKEN_EXPIRESIN;

        const NEW_RTOKEN = jwt.sign({}, process.env.JWT_SECRET, {
            algorithm: process.env.JWT_SIGN_ALGORITHM,
            expiresIn: expiresIn,
        });

        // 숫자값과 단위값을 분리 (7d 면 7와 d를 분리)
        const numericValue = parseInt(expiresIn);
        const unit = expiresIn.replace(numericValue.toString(), '');

        const expirationDateTime = moment().add(numericValue, unit).add(9, 'hours').format('YYYY.MM.DD HH:mm:ss');

        await User.update({ refresh_token: NEW_RTOKEN }, { where: { id: userId } });
        return { resfreshToken: NEW_RTOKEN, expirationDateTime: expirationDateTime };
    },

    //verifyAToken(access_token을 인증해주는 함수)는 middleware/index.js에 있음.

    verifyRToken: async (rToken, userId) => {
        try {
            const USER_INFO = await User.findOne({ where: { id: userId } });
            const DB_TOKEN = USER_INFO.refresh_token;
            if (rToken === DB_TOKEN) {
                try {
                    jwt.verify(rToken, process.env.JWT_SECRET); //유효 시간 체크
                    return true;
                } catch (err) {
                    return false;
                }
            } else return false;
        } catch (error) {
            return false;
        }
    },
};
