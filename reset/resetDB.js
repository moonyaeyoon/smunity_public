const Major = require('./models/major');
const Board = require('./models/board');
const User = require('./models/user');

const RESET_DB_CONST = require('./reset/resetDbConst');
const SUPER_ACCOUNT = RESET_DB_CONST.SUPER_ACCOUNT;
const COMMON_BOARD_LIST = RESET_DB_CONST.COMMON_BOARD_LIST;
const MAJOR_LIST = RESET_DB_CONST.MAJOR_LIST;

const createMajorBoards = (majorName, majorId) => {
    COMMON_BOARD_LIST.forEach((BOARD_INFO) => {
        Board.create({
            boardName: `${majorName}-${BOARD_INFO.boardName}`,
            isCanAnonymous: BOARD_INFO.isCanAnonymous,
            isNotice: BOARD_INFO.isNotice,
            MajorId: majorId,
        });
    });
};

exports.resetDB = async () => {
    //create super account
    const superUser = await User.create({
        schoolId: SUPER_ACCOUNT.schoolId,
        email: SUPER_ACCOUNT.email,
        nickname: SUPER_ACCOUNT.nickname,
        password: SUPER_ACCOUNT.password,
        provider: SUPER_ACCOUNT.provider,
    });

    //create all majors and boards
    for (let majorIndex = 0; majorIndex < MAJOR_LIST.length; majorIndex++) {
        const MAJOR_NAME = MAJOR_LIST[majorIndex];

        Major.create({ majorName: MAJOR_NAME });
        superUser.addMajor(majorIndex + 1);

        createMajorBoards(MAJOR_NAME, majorIndex + 1);
    }

    //add board auth to super account
    for (let BOARD_INDEX = 1; BOARD_INDEX <= COMMON_BOARD_LIST.length * 3; BOARD_INDEX++) {
        superUser.addBoard(BOARD_INDEX);
    }
};
