const Sequelize = require('sequelize');

module.exports = class Major extends Sequelize.Model {
    static init(sequelize) {
        return super.init(
            {
                major_name: {
                    type: Sequelize.STRING(30),
                    allowNull: false,
                },
            },
            {
                sequelize,
                timestamps: false,
                underscored: true,
                modelName: 'Major',
                tableName: 'majors',
                paranoid: true,
                charset: 'utf8mb4',
                collate: 'utf8mb4_general_ci',
            }
        );
    }
    static associate(db) {}
};
