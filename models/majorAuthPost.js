const Sequelize = require('sequelize');

module.exports = class majorAuthPost extends Sequelize.Model {
    static init(sequelize) {
        return super.init(
            {
                imageUrl: {
                    type: Sequelize.STRING(120),
                    allowNull: false,
                },
                content: {
                    type: Sequelize.STRING(200),
                    allowNull: true,
                },
            },
            {
                sequelize,
                timestamps: true,
                underscored: false,
                modelName: 'MajorAuthPost',
                tableName: 'majorAuthPosts',
                paranoid: true,
                charset: 'utf8mb4',
                collate: 'utf8mb4_general_ci',
            }
        );
    }
    static associate(db) {
        db.MajorAuthPost.belongsTo(db.User);
    }
};
