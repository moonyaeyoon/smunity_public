const jwt = require('jsonwebtoken');
const { where } = require('sequelize');
const User = require('../models/user');

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
        const NEW_RTOKEN = jwt.sign({}, process.env.JWT_SECRET, {
            algorithm: process.env.JWT_SIGN_ALGORITHM,
            expiresIn: process.env.JWT_REFRESH_TOKEN_EXPIRESIN,
        });
        await User.update({ refresh_token: NEW_RTOKEN }, { where: { id: userId } });
        return NEW_RTOKEN;
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
