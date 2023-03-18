const Sequelize = require('sequelize');

module.exports = class User extends Sequelize.Model {
    static init(sequelize) {
        return super.init(
            {
                schoolId: {
                    type: Sequelize.STRING(15),
                    allowNull: false,
                    unique: true,
                },
                email: {
                    type: Sequelize.STRING(100),
                    allowNull: false,
                    unique: true,
                },
                nickname: {
                    type: Sequelize.STRING(100),
                    allowNull: true,
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
                snsId: {
                    type: Sequelize.STRING(30),
                    allowNull: true,
                },
                profileImgUrl: {
                    type: Sequelize.STRING(500),
                    allowNull: true,
                },
            },
            {
                sequelize,
                timestamps: true,
                underscored: false,
                modelName: 'User',
                tableName: 'users',
                paranoid: true,
                charset: 'utf8mb4',
                collate: 'utf8mb4_general_ci',
            }
        );
    }
    static associate(db) {
        //Post관련
        db.User.hasMany(db.Post);
        db.User.belongsToMany(db.Post, { through: 'UserLikePosts' });
        db.User.belongsToMany(db.Post, { through: 'UserUnlikePosts' });
        db.User.belongsToMany(db.Post, { through: 'UserScrapPosts' });
        db.User.belongsToMany(db.Post, { through: 'UserReportPosts' });

        //댓글 관련
        db.User.hasMany(db.Comment);
        db.User.belongsToMany(db.Comment, { through: 'UserLikeComments' });
        db.User.belongsToMany(db.Comment, { through: 'UserUnlikeComments' });
        db.User.belongsToMany(db.Comment, { through: 'UserReportComments' });

        //학과 관련
        db.User.belongsToMany(db.Major, { through: 'UserMajors' });

        //게시판 권한 관련
        db.User.belongsToMany(db.Board, { through: 'AllowWriteBoards' });
        db.User.belongsToMany(db.Board, { through: 'AllowReadBoards' });
    }
};
