const Sequelize = require('sequelize');

module.exports = class board extends Sequelize.Model {
    static init(sequelize) {
        return super.init(
            {
                boardName: {
                    type: Sequelize.STRING(40),
                    allowNull: false,
                },
                isCanAnonymous: {
                    type: Sequelize.BOOLEAN,
                    allowNull: false,
                },
                isNotice: {
                    type: Sequelize.BOOLEAN,
                    allowNull: false,
                },
                noticeUserIdList: {
                    type: Sequelize.STRING(1000),
                    allowNull: true,
                },
            },
            {
                sequelize,
                timestamps: true,
                underscored: false,
                modelName: 'Board',
                tableName: 'boards',
                paranoid: true,
                charset: 'utf8mb4',
                collate: 'utf8mb4_general_ci',
            }
        );
    }
    static associate(db) {
        db.Board.belongsTo(db.Major);
        db.Board.hasMany(db.Post);
    }
};
