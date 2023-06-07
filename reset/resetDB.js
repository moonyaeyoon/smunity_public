const Major = require('../models/major');
const Board = require('../models/board');
const User = require('../models/user');

const RESET_DB_CONST = require('./resetDbConst');
const { UserMajor } = require('../models');
const SUPER_ACCOUNT = RESET_DB_CONST.SUPER_ACCOUNT;
const COMMON_BOARD_LIST = RESET_DB_CONST.COMMON_BOARD_LIST;
const MAJOR_LIST = RESET_DB_CONST.MAJOR_LIST;

let nowBoardId = 1; // DB생성 시 순서를 강제로 정하기 위한 변수임
let nowMajorId = 1; // DB생성 시 순서를 강제로 정하기 위한 변수임
const createMajorBoards = async (majorName, majorId) => {
    for (let index = 0; index < COMMON_BOARD_LIST.length; index++) {
        const NOW_BOARD = await Board.create({
            board_name: `${majorName}-${COMMON_BOARD_LIST[index].boardName}`,
            is_can_anonymous: COMMON_BOARD_LIST[index].isCanAnonymous,
            is_notice: COMMON_BOARD_LIST[index].isNotice,
            major_id: majorId,
        });
        if (NOW_BOARD.is_notice == true) {
            await NOW_BOARD.update({ notice_user_id_list: 1 });
        }
    }
};

exports.resetDB = async () => {
    //create super account
    const superUser = await User.create({
        school_id: SUPER_ACCOUNT.school_id,
        email: SUPER_ACCOUNT.email,
        nickname: SUPER_ACCOUNT.nickname,
        password: SUPER_ACCOUNT.password,
        provider: SUPER_ACCOUNT.provider,
    });

    //create all majors and boards
    for (let majorIndex = 0; majorIndex < MAJOR_LIST.length; majorIndex++) {
        const MAJOR_NAME = MAJOR_LIST[majorIndex];
        const NOW_MAJOR = await Major.create({ id: nowMajorId++, major_name: MAJOR_NAME });
        await UserMajor.create({ user_id: superUser.id, major_id: NOW_MAJOR.id });
        await createMajorBoards(MAJOR_NAME, NOW_MAJOR.id);
    }
};
