const Sequelize = require('sequelize');

module.exports = class UserUnlikeComment extends Sequelize.Model {
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
                modelName: 'UserUnlikeComment',
                tableName: 'UserUnlikeComments',
                paranoid: true,
                charset: 'utf8mb4',
                collate: 'utf8mb4_general_ci',
            }
        );
    }
    static associate(db) {
        
    }
};
