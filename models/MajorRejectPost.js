const Sequelize = require('sequelize');

module.exports = class MajorRejectPost extends Sequelize.Model {
    static init(sequelize) {
        return super.init(
            {
                reject_text: {
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
                modelName: 'MajorRejectPost',
                tableName: 'MajorRejectPosts',
                paranoid: true,
                charset: 'utf8mb4',
                collate: 'utf8mb4_general_ci',
            }
        );
    }
    static associate(db) {}
};
