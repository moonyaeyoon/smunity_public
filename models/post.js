const Sequelize = require('sequelize');

module.exports = class Post extends Sequelize.Model {
    static init(sequelize) {
        return super.init(
            {
                title: {
                    type: Sequelize.STRING(100),
                    allowNull: false,
                },
                content: {
                    type: Sequelize.STRING(2000),
                    allowNull: false,
                },
                imgUrls: {
                    type: Sequelize.STRING(5000),
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
                isAnonymous: {
                    type: Sequelize.BOOLEAN,
                    allowNull: false,
                },
            },
            {
                sequelize,
                timestamps: true, //add createAt & UpdateAt
                underscored: false, //true: createAt => create_at
                modelName: 'Post', //name in node project
                tableName: 'posts',
                paranoid: true, // add deleteAt
                charset: 'utf8mb4', // for hangul and emoji
                collate: 'utf8mb4_general_ci', // for hangul and emoji
            }
        );
    }
    static associate(db) {
        db.Post.belongsTo(db.User);
        db.Post.belongsTo(db.Major);
        db.Post.belongsTo(db.Board);

        db.Post.hasMany(db.Comment);

        //사용자 액션 관련
        db.Post.belongsToMany(db.User, { through: 'UserLikePosts' });
        db.Post.belongsToMany(db.User, { through: 'UserUnlikePosts' });
        db.Post.belongsToMany(db.User, { through: 'UserScrapPosts' });
        db.Post.belongsToMany(db.User, { through: 'UserReportPosts' });
    }
};
