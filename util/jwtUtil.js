const jwt = require('jsonwebtoken');
const redisClient = require('./redis');

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

    signRToken: () => {
        return jwt.sign({}, process.env.JWT_SECRET, {
            algorithm: process.env.JWT_SIGN_ALGORITHM,
            expiresIn: process.env.JWT_REFRESH_TOKEN_EXPIRESIN,
        });
    },

    //verifyAToken(access_token을 인증해주는 함수)는 middleware/index.js에 있음.

    verifyRToken: async (rToken, userId) => {
        try {
            const DB_TOKEN = await redisClient.get(userId);
            if (rToken === DB_TOKEN) {
                try {
                    jwt.verify(rToken, JWT_SECRET); //유효 시간 체크
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
