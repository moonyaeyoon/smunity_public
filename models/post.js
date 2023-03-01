const Sequelize = require('sequelize');

module.exports = class Post extends Sequelize.Model {
    static init(sequelize){
        return super.init({
            title: {
                type: Sequelize.STRING(200),
                allowNull: false,
            },
            content: {
                type: Sequelize.STRING(1000),
                allowNull: false,
            },
            imgUrl: {
                type: Sequelize.STRING(1000),
                allowNull: true,
            },
            views: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0
            },
            likes: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0
            },
            isAnonymous: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
            }
        },{
            sequelize,
            timestamps: true, //add createAt & UpdateAt
            underscored: false, //true: createAt => create_at
            modelName: 'Post', //name in node project
            tableName: 'posts', 
            paranoid: true, // add deleteAt
            charset: 'utf8mb4', // for hangul and emoji
            collate: 'utf8mb4_general_ci', // for hangul and emoji
        });
    }
    static associate(db){
        db.Post.belongsTo(db.User);
        db.Post.hasMany(db.Comment);
        db.Post.belongsTo(db.Board);
    }
}