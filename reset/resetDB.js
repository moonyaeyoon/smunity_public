const Major = require('../models/major');
const Board = require('../models/board');
const User = require('../models/user');

const RESET_DB_CONST = require('./resetDbConst');
const { UserMajor } = require('../models');
const SUPER_ACCOUNT = RESET_DB_CONST.SUPER_ACCOUNT;
const COMMON_BOARD_LIST = RESET_DB_CONST.COMMON_BOARD_LIST;
const MAJOR_LIST = RESET_DB_CONST.MAJOR_LIST;

const createMajorBoards = async (majorName, majorId) => {
    COMMON_BOARD_LIST.forEach(async (BOARD_INFO) => {
        await Board.create({
            board_name: `${majorName}-${BOARD_INFO.boardName}`,
            is_can_anonymous: BOARD_INFO.isCanAnonymous,
            is_notice: BOARD_INFO.isNotice,
            major_id: majorId,
        });
    });
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

    const promises = [];
    for (let majorIndex = 0; majorIndex < MAJOR_LIST.length; majorIndex++) {
        const MAJOR_NAME = MAJOR_LIST[majorIndex];
        promises.push(Major.create({ major_name: MAJOR_NAME }));
    }

    Promise.all(promises).then((results) => {
        console.log(results);
    });

    //create all majors and boards
    for (let majorIndex = 0; majorIndex < MAJOR_LIST.length; majorIndex++) {
        
        
        const MAJOR_NAME = MAJOR_LIST[majorIndex];

        const MAJOR_INFO = await Major.findOne({ id: majorIndex+1 });
        await UserMajor.create({user_id: superUser.id, major_id: MAJOR_INFO.id})
        await createMajorBoards(MAJOR_NAME, majorIndex + 1);
    }
};
