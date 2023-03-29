const nodemailer = require('nodemailer');
const aws = require('aws-sdk');
const ejs = require('ejs');
const crypto = require('crypto');

aws.config.update({
    accessKeyId: process.env.SES_AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SES_ACCESS_KEY,
    region: 'us-east-1',
});
exports.mailing = async (req, res, next) => {
    const { userEmail } = req.body;
    console.log(userEmail);

    //해시코드 생성
    const code = crypto.randomBytes(80).toString('hex');
    console.log(code);

    const ses = new aws.SES({
        apiVersion: '2010-12-01',
    });

    let transporter = nodemailer.createTransport({
        SES: { ses, aws },
    });

    transporter.sendMail(
        {
            from: 'SMUS<sja3410@gmail.com>',
            to: userEmail,
            subject: 'SMUS 회원가입 인증메일 입니다.',
            text: 'www.naver.com',
        },
        (err, info) => {
            if (err) {
                console.log(err);
                return res.status(500).json(err);
            }
        }
    );

    return res.status(200).json({
        isSuccess: true,
    });
};
