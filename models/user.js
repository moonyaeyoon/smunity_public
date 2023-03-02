const Sequelize = require('sequelize');

module.exports = class User extends Sequelize.Model {
    static init(sequelize){
        return super.init({
            email: {
                type: Sequelize.STRING(40),
                allowNull: true,
                unique: true,
            },
            nick: {
                type: Sequelize.STRING(15),
                allowNull: false,
            },
            password: {
                type: Sequelize.STRING(100),
                allowNull: true,
            },
            provider: {
                type: Sequelize.STRING(10),
                allowNull: false,
                defaultValue: 'local',
            },
            snsID: {
                type: Sequelize.STRING(30),
                allowNull: true,
            },
            profileImgUrl: {
                type: Sequelize.STRING(1000),
                allowNull: true,
            }
        },{
            sequelize,
            timestamps: true,
            underscored: false,
            modelName: 'User',
            tableName: 'users',
            paranoid: true,
            charset: 'utf8mb4',
            collate: 'utf8mb4_general_ci',
        });
    }
    static associate(db){
        db.User.hasMany(db.Post);
        db.User.belongsToMany(db.Major, {through: 'UserMajor'});
        db.User.hasMany(db.Comment);
        db.User.belongsToMany(db.Board, {through: 'AllowBoardId'});
    }
}