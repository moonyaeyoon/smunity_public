const Sequelize = require('sequelize');
const env = process.env.NODE_ENV || 'development';
const config = require('../config/config')[env];
const Board = require('./board');
const Comment = require('./comment');
const Major = require('./major');
const MajorAuthPost = require('./MajorAuthPost');
const MajorRejectPost = require('./MajorRejectPost');
const Post = require('./post');
const User = require('./user');
const UserLikeComment = require('./UserLikeComment')
const UserLikePost = require('./UserLikePost')
const UserMajor = require('./UserMajor')
const UserReportComment = require('./UserReportComment')
const UserReportPost = require('./UserReportPost')
const UserScrapPost = require('./UserScrapPost')
const UserUnlikeComment = require('./UserUnlikeComment')
const UserUnlikePost = require('./UserUnlikePost')



const db = {};
const sequelize = new Sequelize(config.database, config.username, config.password, config);

db.sequelize = sequelize;
db.Board = Board;
db.Comment = Comment;
db.Major = Major;
db.MajorAuthPost = MajorAuthPost;
db.MajorRejectPost = MajorRejectPost;
db.Post = Post;
db.User = User;

db.UserLikeComment = UserLikeComment
db.UserLikePost = UserLikePost
db.UserMajor = UserMajor
db.UserReportComment = UserReportComment
db.UserReportPost = UserReportPost
db.UserScrapPost = UserScrapPost
db.UserUnlikeComment = UserUnlikeComment
db.UserUnlikePost = UserUnlikePost

Board.init(sequelize);
Comment.init(sequelize);
Major.init(sequelize);
MajorAuthPost.init(sequelize);
MajorRejectPost.init(sequelize);
Post.init(sequelize);
User.init(sequelize);
UserLikeComment.init(sequelize)
UserLikePost.init(sequelize)
UserMajor.init(sequelize)
UserReportComment.init(sequelize)
UserReportPost.init(sequelize)
UserScrapPost.init(sequelize)
UserUnlikeComment.init(sequelize)
UserUnlikePost.init(sequelize)

// Board.associate(db);
// Comment.associate(db);
// Major.associate(db);
// MajorAuthPost.associate(db);
// Post.associate(db);
// User.associate(db);

module.exports = db;
