const Sequelize = require('sequelize');

module.exports = class board extends Sequelize.Model {
    static init(sequelize) {
        return super.init(
            {
                board_name: {
                    type: Sequelize.STRING(40),
                    allowNull: false,
                },
                is_can_anonymous: {
                    type: Sequelize.BOOLEAN,
                    allowNull: false,
                },
                is_notice: {
                    type: Sequelize.BOOLEAN,
                    allowNull: false,
                },
                notice_user_id_list: {
                    type: Sequelize.STRING(1000),
                    allowNull: true,
                },
                major_id: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                },
            },
            {
                sequelize,
                timestamps: true,
                underscored: true,
                modelName: 'Board',
                tableName: 'boards',
                paranoid: true,
                charset: 'utf8mb4',
                collate: 'utf8mb4_general_ci',
            }
        );
    }
    static associate(db) {}
};
