const bcrypt = require('bcrypt');
const passport = require('passport');
const User = require('../../models/user');
const Major = require('../../models/major');
const Board = require('../../models/board');

const majorNamesObject = {
  "001": "컴퓨터과학과",
  "002": "휴먼지능정보공학전공",
  "003": "경제학과",
  "004": "상명대학교",
}

const majorCodeObject = {
  "컴퓨터과학과": "001",
  "휴먼지능정보공학전공": "002",
  "경제학과": "003",
  "상명대학교": "004",
}

const boardNameObject = {
  "001": "자유게시판",
  "002": "비밀게시판",
  "003": "공지게시판",
}

exports.join = async (req, res, next) => {
  const { email, nick, password, majornames } = req.body;
  try {
    if(!email || !nick || !password || !majornames){
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

    //majorNames이상시 반환
    let majorCode = Array();
    const majorNameList = majornames.split(",")
    let isWrong = false
    majorNameList.forEach(e => {
      if(Object.keys(majorCodeObject).includes(e)){
        majorCode.push(majorCodeObject[e]); 
      }else {
        isWrong = true
        return res.status(402).json({
          code: 402,
          message: "전공 이름 불일치: " + e
        });
      } 
    });

    if(isWrong) return; //다음 코드 실행하지 않기 위함
    
    const hash = await bcrypt.hash(password, 12);
    const newUser = await User.create({
      email,
      nick,
      password: hash,
    });
    majorCode.forEach(e => {
      newUser.addMajor(Number(e));
      newUser.addBoard(e + "001");
      newUser.addBoard(e + "002");
    })
    
    newUser.addMajor(4);
    newUser.addBoard("004001")
    newUser.addBoard("004002")
    
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
