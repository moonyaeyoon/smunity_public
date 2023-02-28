const Sequelize = require('sequelize');

module.exports = class comment extends Sequelize.Model {
    static init(sequelize) {
        return super.init({
            content: {
                type: Sequelize.STRING(1000),
                allowNull: false,
            },
            isAnonymous: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
            }
        },{
            sequelize,
            timestamps: true,
            underscored: false,
            modelName: 'Comment',
            tableName: 'comments',
            paranoid: true,
            charset: 'utf8mb4',
            collate: 'utf8mb4_general_ci',
        });
    }
    static associate(db){
        db.Comment.belongsTo(db.User);
        // db.Comment.hasMany(db.Post);
        db.Comment.belongsTo(db.Post);
    }
}