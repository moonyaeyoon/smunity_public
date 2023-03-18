const Sequelize = require('sequelize');

module.exports = class comment extends Sequelize.Model {
    static init(sequelize) {
        return super.init(
            {
                content: {
                    type: Sequelize.STRING(1000),
                    allowNull: false,
                },
                isAnonymous: {
                    type: Sequelize.BOOLEAN,
                    allowNull: false,
                },
                groupId: {
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
                parentId: {
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
                underscored: false,
                modelName: 'Comment',
                tableName: 'comments',
                paranoid: true,
                charset: 'utf8mb4',
                collate: 'utf8mb4_general_ci',
            }
        );
    }
    static associate(db) {
        db.Comment.belongsTo(db.User);
        db.Comment.belongsTo(db.Post);

        //사용자 액션 관련
        db.Comment.belongsToMany(db.User, { through: 'UserLikeComments' });
        db.Comment.belongsToMany(db.User, { through: 'UserUnlikeComments' });
        db.Comment.belongsToMany(db.User, { through: 'UserReportComments' });
    }
};
