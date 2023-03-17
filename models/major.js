const Sequelize = require('sequelize');

module.exports = class Major extends Sequelize.Model {
    static init(sequelize) {
        return super.init({
            majorName: {
                type: Sequelize.STRING(30),
                allowNull: false,
            }
        },{
            sequelize,
            timestamps: false,
            underscored: false,
            modelName: 'Major',
            tableName: 'majors',
            paranoid: false,
            charset: 'utf8mb4',
            collate: 'utf8mb4_general_ci',
        })
    }
    static associate(db){
        db.Major.belongsToMany(db.User, {through: 'UserMajors'});
        db.Major.hasMany(db.Post);
        db.Major.hasMany(db.Board);
    }
}