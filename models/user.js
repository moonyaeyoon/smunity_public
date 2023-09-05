const Sequelize = require('sequelize');

module.exports = class User extends Sequelize.Model {
    static init(sequelize) {
        return super.init(
            {
                school_id: {
                    type: Sequelize.STRING(15),
                    allowNull: false,
                    unique: true,
                },
                email: {
                    type: Sequelize.STRING(100),
                    allowNull: false,
                },
                nickname: {
                    type: Sequelize.STRING(100),
                    allowNull: true,
                    unique: true,
                },
                password: {
                    type: Sequelize.STRING(100),
                    allowNull: true,
                },
                provider: {
                    type: Sequelize.STRING(20),
                    allowNull: false,
                    defaultValue: 'local',
                },
                sns_id: {
                    type: Sequelize.STRING(30),
                    allowNull: true,
                },
                profile_img_url: {
                    type: Sequelize.STRING(500),
                    allowNull: true,
                },
                refresh_token: {
                    type: Sequelize.STRING(200),
                    allowNull: true,
                },
                email_auth_code: {
                    type: Sequelize.STRING(30),
                    allowNull: true,
                },
                mbti: {
                    type: Sequelize.STRING(5),
                    allowNull: true,
                },
                time_table: {
                    type: Sequelize.STRING(100),
                    allowNull: true,
                },
            },
            {
                sequelize,
                timestamps: true,
                underscored: true,
                modelName: 'User',
                tableName: 'users',
                paranoid: true,
                charset: 'utf8mb4',
                collate: 'utf8mb4_general_ci',
            }
        );
    }
    static associate(db) {}
};
