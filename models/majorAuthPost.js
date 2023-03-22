const Sequelize = require('sequelize');

module.exports = class MajorAuthPost extends Sequelize.Model {
    static init(sequelize) {
        return super.init(
            {
                image_url: {
                    type: Sequelize.STRING(120),
                    allowNull: false,
                },
                content: {
                    type: Sequelize.TEXT('medium'),
                    allowNull: true,
                },
                user_id: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                },
            },
            {
                sequelize,
                timestamps: true,
                underscored: true,
                modelName: 'MajorAuthPost',
                tableName: 'MajorAuthPosts',
                paranoid: true,
                charset: 'utf8mb4',
                collate: 'utf8mb4_general_ci',
            }
        );
    }
    static associate(db) {
        
    }
};
