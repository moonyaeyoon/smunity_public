exports.isLoggedIn = (req, res, next) => {
    if (req.isAuthenticated()) {
        next();
    } else {
        res.status(403).json({
            code: 403,
            message: '로그아웃된 상태입니다.',
        });
    }
};

exports.isNotLoggedIn = (req, res, next) => {
    if (!req.isAuthenticated()) {
        next();
    } else {
        res.status(403).json({
            code: 403,
            message: '로그인된 상태입니다.',
        });
    }
};
