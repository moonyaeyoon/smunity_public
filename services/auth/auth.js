const bcrypt = require('bcrypt');
const passport = require('passport');
const User = require('../../models/user');

exports.join = async (req, res, next) => {
  const { email, nick, password } = req.body;
  try {
    if(!email || !nick || !password ){
      return res.status(401).json({
        code: 401,
        message: "양식에 맞지 않음"
      });
    }
    const exUser = await User.findOne({ where: { email } });
    if (exUser) {
      return res.status(400).json({
        code: 400,
        message: "이미 가입된 정보가 있음"
      });
    }
    const hash = await bcrypt.hash(password, 12);
    await User.create({
      email,
      nick,
      password: hash,
    });
    return res.status(201).json({
        code: 201,
        message: "회원가입 완료"
    })
  } catch (error) {
    console.error(error);
    return next(error);
  }
}

exports.login = (req, res, next) => {
  passport.authenticate('local', (authError, user, info) => {
    if (authError) {
      console.error(authError);
      return next(authError);
    }
    if (!user) {
      return res.status(400).json({
        code: 400,
        message: info.message
      })
    }
    return req.login(user, (loginError) => {
      if (loginError) {
        console.error(loginError);
        return next(loginError);
      }
      console.log(user.email);
      return res.status(200).json({
        code:200,
        message: "로그인 성공"
      });
    });
  })(req, res, next);
};

exports.logout = (req, res) => {
  req.logout(() => {
    res.status(200).json({
        code: 200,
        message: "로그아웃 성공"
    });
  });
};
