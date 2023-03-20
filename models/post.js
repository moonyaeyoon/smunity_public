const Sequelize = require('sequelize');

module.exports = class Post extends Sequelize.Model {
    static init(sequelize) {
        return super.init(
            {
                board_id: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                },
                user_id: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                },
                title: {
                    type: Sequelize.STRING(100),
                    allowNull: false,
                },
                content: {
                    type: Sequelize.TEXT('medium'),
                    allowNull: false,
                },
                img_urls: {
                    type: Sequelize.TEXT('medium'),
                    allowNull: true,
                },
                views: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                    defaultValue: 0,
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
                scraps: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                    defaultValue: 0,
                },
                reports: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                    defaultValue: 0,
                },
                is_anonymous: {
                    type: Sequelize.BOOLEAN,
                    allowNull: false,
                },
            },
            {
                sequelize,
                timestamps: true, //add createAt & UpdateAt
                underscored: true, //true: createAt => create_at
                modelName: 'Post', //name in node project
                tableName: 'posts',
                paranoid: true, // add deleteAt
                charset: 'utf8mb4', // for hangul and emoji
                collate: 'utf8mb4_general_ci', // for hangul and emoji
            }
        );
    }
    static associate(db) {
        
    }
};
