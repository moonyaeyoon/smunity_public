const Sequelize = require('sequelize');

module.exports = class UserReportComment extends Sequelize.Model {
    static init(sequelize) {
        return super.init(
            {
                user_id: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                },
                comment_id: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                },
            },
            {
                sequelize,
                timestamps: true,
                underscored: true,
                modelName: 'UserReportComment',
                tableName: 'UserReportComments',
                paranoid: true,
                charset: 'utf8mb4',
                collate: 'utf8mb4_general_ci',
            }
        );
    }
    static associate(db) {}
};
