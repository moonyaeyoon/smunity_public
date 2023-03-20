exports.USER_SIGNIN_SUCCESS_STATUS = 200;
exports.getSuccessSignInJson = (aToken, rToken) => {
    return {
        status_code: 200,
        message: '로그인이 성공했습니다.',
        access_token: aToken,
        refresh_token: rToken,
    };
};

exports.GET_NEW_ACCESS_TOKEN_STATUS = 240;
exports.getNewAccessTokenJson = (aToken) => {
    return {
        status_code: 240,
        message: '새로운 Access Token이 발급되었습니다.',
        access_token: aToken,
    };
};
