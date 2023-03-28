module.exports = {
    development: {
        username: 'admin',
        password: '1Q5ACZnjz7jpISOCAn8M',
        database: 'capstone',
        host: 'smus.cdnw2s0ur6lu.ap-northeast-2.rds.amazonaws.com',
        dialect: 'mysql',
    },
    test: {
        username: 'root',
        password: process.env.DB_PASSWORD,
        database: 'capstone',
        host: '127.0.0.1',
        dialect: 'mysql',
    },
    production: {
        username: 'root',
        password: null,
        database: 'database_production',
        host: '127.0.0.1',
        dialect: 'mysql',
    },
};
