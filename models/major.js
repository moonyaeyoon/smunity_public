const Sequelize = require('sequelize');

module.exports = class Major extends Sequelize.Model {
    static init(sequelize) {
        return super.init({
            majorName: {
                type: Sequelize.STRING(40),
                allowNull: false,
            }
        },{
            sequelize,
            timestamps: false,
            underscored: false,
            modelName: 'Major',
            tableName: 'majors',
            paranoid: false,
            charset: 'utf8',
            collate: 'utf8_general_ci',
        })
    }
    static associate(db){
        db.Major.belongsToMany(db.User, {through: 'UserMajor'});
        db.Major.hasMany(db.Post);
    }
}