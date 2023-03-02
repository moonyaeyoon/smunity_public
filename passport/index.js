const passport = require('passport');
const local = require('./localStrategy');
const User = require('../models/user');

module.exports = () => {
  passport.serializeUser((user, done) => {
    console.log('serialize');
    done(null, user.id);
  });

  passport.deserializeUser((id, done) => {
    console.log('deserialize');
    User.findOne({where: { id }})
      .then(user => done(null, user))
      .catch(err => done(err));
  });

  local();
};
