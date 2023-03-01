const Sequelize = require('sequelize');

module.exports = class Post extends Sequelize.Model {
    static init(sequelize){
        return super.init({
            content: {
                type: Sequelize.STRING(140),
                allowNull: false,
            },
            img: {
                type: Sequelize.STRING(200),
                allowNull: true,
            },
            title: {
                type: Sequelize.STRING(100),
                allowNull: false,
            },
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
        db.Post.belongsTo(db.Major);
        db.Post.hasMany(db.Comment);
    }
}