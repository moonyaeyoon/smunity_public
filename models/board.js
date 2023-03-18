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

        //사용자 권한 관련
        db.Board.belongsToMany(db.User, { through: 'AllowReadBoards' });
        db.Board.belongsToMany(db.User, { through: 'AllowWriteBoards' });
    }
};
