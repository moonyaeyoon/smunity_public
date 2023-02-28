const Sequelize = require('sequelize');

module.exports = class board extends Sequelize.Model {
    static init(sequelize) {
        return super.init({
            boardId: {
                type: Sequelize.STRING(6),
                allowNull: false,
                primaryKey: true,
                unique: true
            },
            boardName: {
                type: Sequelize.STRING(40),
                allowNull: false,
            },
            isCanAnonymous: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
            },
            isFree: {
                type: Sequelize.BOOLEAN,
                allowNull: false
            }
        },{
            sequelize,
            timestamps: true,
            underscored: false,
            modelName: 'Board',
            tableName: 'boards',
            paranoid: true,
            charset: 'utf8mb4',
            collate: 'utf8mb4_general_ci',
        });
    }
    static associate(db){
        db.Board.belongsTo(db.Major);
        db.Board.hasMany(db.Post);
        db.Board.belongsToMany(db.User, {through: 'AllowBoardId'});
    }
}