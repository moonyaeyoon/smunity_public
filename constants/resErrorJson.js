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

exports.USER_NOT_EXIST = {
    status_code: 400,
    res_json: {
        status_code: 400,
        message: '존재하지 않는 사용자입니다.',
    },
};

exports.POST_NOT_EXIST = {
    status_code: 400,
    res_json: {
        status_code: 400,
        message: '존재하지 않는 게시글입니다.',
    },
};

exports.COMMENT_NOT_EXIST = {
    status_code: 400,
    res_json: {
        status_code: 400,
        message: '존재하지 않는 댓글입니다.',
    },
};

exports.BOARD_NOT_EXIST = {
    status_code: 400,
    res_json: {
        status_code: 400,
        message: '존재하지 않는 게시판입니다.',
    },
};

exports.MAJOR_NOT_EXIST = {
    status_code: 400,
    res_json: {
        status_code: 400,
        message: '존재하지 않는 전공입니다.',
    },
};

exports.USER_NO_AUTH = {
    status_code: 402,
    res_json: {
        status_code: 402,
        message: '접근 권한이 없습니다.',
    },
};

exports.POST_ALREADY_REPORT = {
    status_code: 400,
    res_json: {
        status_code: 400,
        message: '이미 신고한 게시글입니다.',
    },
};

exports.COMMENT_ALREADY_REPORT = {
    status_code: 400,
    res_json: {
        status_code: 400,
        message: '이미 신고한 댓글입니다.',
    },
};

exports.SIGN_IN_ERROR = {
    status_code: 403,
    res_json: {
        status_code: 403,
        message: '로그인이 실패했습니다.',
    },
};

exports.EMAIL_AUTH_ERROR = {
    status_code: 405,
    res_json: {
        status_code: 405,
        message: '학교 이메일 인증을 완료하지 않았습니다.',
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

exports.sendErrorLog = (error) => {
    return {
        message: '예상치 않는 에러입니다.',
        error_message: error,
    };
};

exports.emailAuthError = () => {
    return "<script>alert('이메일 인증이 실패했습니다. 인증 링크를 다시 한 번 확인하세요.');</script>";
};

exports.authCompleted = () => {
    return "<script>alert('이미 인증되 링크입니다.');</script>";
};
