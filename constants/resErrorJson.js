//Success Response(20?)
exports.USER_NOT_EXISTS = {
    status_code: 200,
    res_json: {
        status_code: 200,
        message: '가입이 가능한 학번입니다.',
    },
};

exports.ADD_USER_SUCCESS = {
    status_code: 201,
    res_json: {
        status_code: 201,
        message: '회원 가입이 완료되었습니다.',
    },
};

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

