module.exports = {
    development: {
        username: process.env.RDS_USERNAME,
        password: process.env.RDS_PASSWORD,
        database: 'capstone',
        host: process.env.RDS_HOST,
        dialect: 'mysql',
        logging: false,
    },
    test: {
        username: 'root',
        password: process.env.DB_PASSWORD,
        database: 'capstone',
        host: '127.0.0.1',
        dialect: 'mysql',
        logging: false,
    },
    production: {
        username: 'root',
        password: null,
        database: 'database_production',
        host: '127.0.0.1',
        dialect: 'mysql',
        logging: false,
    },
};
