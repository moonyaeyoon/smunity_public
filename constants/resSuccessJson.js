exports.USER_SIGNIN_SUCCESS_STATUS = 201;
exports.getSuccessSignInJson = (aToken, rToken) => {
    return {
        status_code: 200,
        message: '가입이 가능한 학번입니다.',
        access_token: aToken,
        refresh_token: rToken
    };
};
