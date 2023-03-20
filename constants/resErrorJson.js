//Failed Response(40?)
exports.REQ_FORM_ERROR = {
    status_code: 401,
    res_json: {
        status_code: 401,
        message: 'API 요청 양식이 틀렸습니다.',
    },
};

exports.USER_EXISTS = {
    status_code: 400,
    res_json: {
        status_code: 400,
        message: '이미 존재한 사용자입니다.',
    },
};

exports.SIGN_IN_ERROR = {
    status_code: 403,
    res_json: {
        status_code: 403,
        message: '로그인이 실패했습니다.',
    },
};

//JWT관련
exports.JWT_TOKEN_NOT_FOUND = {
    status_code: 440,
    res_json: {
        status_code: 440,
        message: '토큰을 찾지 못해 사용자 인증을 할 수 없습니다.',
    },
};

exports.JWT_TOKEN_WRONG = {
    status_code: 441,
    res_json: {
        status_code: 441,
        message: '잘못된 토큰입니다.',
    },
};

exports.JWT_TOKEN_EXPIRED = {
    status_code: 444,
    res_json: {
        status_code: 444,
        message: '토큰이 만료되었습니다.',
    },
};

exports.JWT_REFRESH_TOKEN_EXPIRED = {
    status_code: 445,
    res_json: {
        status_code: 445,
        message: 'Refresh토큰이 만료되었습니다.',
    },
};
