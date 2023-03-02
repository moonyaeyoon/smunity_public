const bcrypt = require('bcrypt');
const passport = require('passport');
const User = require('../../models/user');
const Major = require('../../models/major');
const Board = require('../../models/board');

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
    const newUser = await User.create({
      email,
      nick,
      password: hash,
    });
    newUser.addMajor(1);
    newUser.addMajor(2);
    newUser.addMajor(3);
    newUser.addMajor(4);
    newUser.addBoard("001001");
    newUser.addBoard("001002");
    newUser.addBoard("001003"); //컴과 공지 게시판 쌉가능
    newUser.addBoard("002001");
    newUser.addBoard("002002");
    newUser.addBoard("003001");
    newUser.addBoard("003002");
    newUser.addBoard("003003"); //경제학과 공지 게시판 쌉가능
    newUser.addBoard("004001");
    newUser.addBoard("004002");
    newUser.addBoard("004003"); //학교 공지 게시판 쌉가능
    return res.status(201).json({
        code: 201,
        message: "회원가입 완료"
    });
    
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
      if(info.message == 'Missing credentials'){
        return res.status(401).json({
          code: 401,
          message: info.message
        })
      }
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
