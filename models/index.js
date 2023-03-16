const Sequelize = require('sequelize');
const env = process.env.NODE_ENV || 'development';
const config = require('../config/config')[env];
const User = require('./user');
const Post = require('./post');
const Major = require('./major');
const Board = require('./board');
const Comment = require('./comment');


const db = {};
const sequelize = new Sequelize(
    config.database, config.username, config.password, config,
);

db.sequelize = sequelize;
db.Board = Board;
db.Comment = Comment;
db.User = User;
db.Post = Post;
db.Major = Major;

Board.init(sequelize);
Comment.init(sequelize);
User.init(sequelize);
Post.init(sequelize);
Major.init(sequelize);

Board.associate(db);
Comment.associate(db);
User.associate(db);
Post.associate(db);
Major.associate(db);

module.exports = db;
