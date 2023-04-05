exports.USER_SIGNIN_SUCCESS_STATUS = 200;
exports.getSuccessSignInJson = (aToken, rToken) => {
    return {
        status_code: 200,
        message: '로그인이 성공했습니다.',
        access_token: aToken,
        refresh_token: rToken,
    };
};

//Success Response(20?)
exports.USER_CAN_SIGNUP = {
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
        profile_image_url: null
    },
};

exports.ADD_POST_SUCCESS = {
    status_code: 201,
    res_json: {
        status_code: 201,
        message: '게시글의 추가가 완료되었습니다.',
    },
};

exports.UPDATE_POST_SUCCESS = {
    status_code: 201,
    res_json: {
        status_code: 201,
        message: '게시글의 수정이 완료되었습니다.',
    },
};

exports.DELETE_POST_SUCCESS = {
    status_code: 201,
    res_json: {
        status_code: 201,
        message: '게시글의 삭제가 완료되었습니다.',
    },
};

exports.REPORT_POST_SUCCESS = {
    status_code: 201,
    res_json: {
        status_code: 201,
        message: '게시글 신고가 접수되었습니다.',
    },
};

exports.END_OF_POST = {
    status_code: 204,
    res_json: {
        status_code: 204,
        message: '게시글이 더 이상 없습니다.',
    },
};

exports.ADD_COMMENT_SUCCESS = {
    status_code: 201,
    res_json: {
        status_code: 201,
        message: '댓글의 추가가 완료되었습니다.',
    },
};

exports.UPDATE_COMMENT_SUCCESS = {
    status_code: 201,
    res_json: {
        status_code: 201,
        message: '댓글의 수정이 완료되었습니다.',
    },
};

exports.DELETE_COMMENT_SUCCESS = {
    status_code: 201,
    res_json: {
        status_code: 201,
        message: '댓글의 삭제가 완료되었습니다.',
    },
};

exports.REPORT_COMMENT_SUCCESS = {
    status_code: 201,
    res_json: {
        status_code: 201,
        message: '댓글 신고가 접수되었습니다.',
    },
};

exports.GET_NEW_ACCESS_TOKEN_STATUS = 240;
exports.getNewAccessTokenJson = (aToken) => {
    return {
        status_code: 240,
        message: '새로운 Access Token이 발급되었습니다.',
        access_token: aToken,
    };
};

exports.emailAuthSuccess = () => {
    return "<script>alert('이메일 인증이 완료되었습니다!');</script>";
};

exports.LIKE_POST_SUCCESS_STATUS = 201;
exports.likePostSuccessJson = (totalLikes) => {
    return {
        status_code: 201,
        message: '게시글에 좋아요를 추가했습니다.',
        total_likes: totalLikes,
    };
};

exports.UNDO_LIKE_POST_SUCCESS_STATUS = 201;
exports.UndoLikePostSuccessJson = (totalLikes) => {
    return {
        status_code: 201,
        message: '게시글에 좋아요를 취소했습니다.',
        total_likes: totalLikes,
    };
};

exports.SCRAP_POST_SUCCESS_STATUS = 201;
exports.scrapPostSuccessJson = (totalScraps) => {
    return {
        status_code: 201,
        message: '게시글에 스크랩을 추가했습니다.',
        total_scraps: totalScraps,
    };
};

exports.UNDO_SCRAP_POST_SUCCESS_STATUS = 201;
exports.UndoScrapPostSuccessJson = (totalScraps) => {
    return {
        status_code: 201,
        message: '게시글에 스크랩을 취소했습니다.',
        total_scraps: totalScraps,
    };
};

exports.LIKE_COMMENT_SUCCESS_STATUS = 201;
exports.likeCommentSuccessJson = (totalLikes) => {
    return {
        status_code: 201,
        message: '댓글에 좋아요를 추가했습니다.',
        total_likes: totalLikes,
    };
};

exports.UNDO_LIKE_COMMENT_SUCCESS_STATUS = 201;
exports.UndoLikeCommentSuccessJson = (totalLikes) => {
    return {
        status_code: 201,
        message: '댓글에 좋아요를 취소했습니다.',
        total_likes: totalLikes,
    };
};
