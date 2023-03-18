const Sequelize = require('sequelize');
const env = process.env.NODE_ENV || 'development';
const config = require('../config/config')[env];
const Board = require('./board');
const Comment = require('./comment');
const Major = require('./major');
const Post = require('./post');
const User = require('./user');

const db = {};
const sequelize = new Sequelize(config.database, config.username, config.password, config);

db.sequelize = sequelize;
db.Board = Board;
db.Comment = Comment;
db.Major = Major;
db.Post = Post;
db.User = User;

Board.init(sequelize);
Comment.init(sequelize);
Major.init(sequelize);
Post.init(sequelize);
User.init(sequelize);

Board.associate(db);
Comment.associate(db);
Major.associate(db);
Post.associate(db);
User.associate(db);

module.exports = db;
