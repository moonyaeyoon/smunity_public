exports.SUPER_ACCOUNT = {
    school_id: '193712345',
    email: 'super',
    nickname: '학생복지팀',
    password: '$2b$12$r3bjYP.fhSyEt1Ychg1i/OosBxb1IaUJsw9yPuVFbLyKgzQiZTiy2',
    provider: 'local',
};

exports.MAJOR_LIST = ['상명대학교', '컴퓨터과학과', '휴먼지능정보공학전공', '경제학과'];

exports.COMMON_BOARD_LIST = [
    {
        boardName: '자유게시판',
        isCanAnonymous: false,
        isNotice: false,
    },
    {
        boardName: '비밀게시판',
        isCanAnonymous: true,
        isNotice: false,
    },
    {
        boardName: '공지게시판',
        isCanAnonymous: false,
        isNotice: true,
    },
];
