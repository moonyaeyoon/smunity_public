const Sequelize = require('sequelize');

module.exports = class comment extends Sequelize.Model {
    static init(sequelize) {
        return super.init(
            {
                post_id: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                },
                user_id: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                },
                content: {
                    type: Sequelize.TEXT('medium'),
                    allowNull: false,
                },
                is_anonymous: {
                    type: Sequelize.BOOLEAN,
                    allowNull: false,
                },
                group_id: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                },
                level: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                },
                childs: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                },
                parent_id: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                },
                likes: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                    defaultValue: 0,
                },
                unlikes: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                    defaultValue: 0,
                },
                reports: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                    defaultValue: 0,
                },
            },
            {
                sequelize,
                timestamps: true,
                underscored: true,
                modelName: 'Comment',
                tableName: 'comments',
                paranoid: true,
                charset: 'utf8mb4',
                collate: 'utf8mb4_general_ci',
            }
        );
    }
    static associate(db) {
        
    }
};
