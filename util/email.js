const nodemailer = require('nodemailer');

const ADMIN1_PRIVATE_KEY = process.env.ADMIN1_PRIVATE_KEY;
const DAUM_SMTP_PASSWORD = process.env.DAUM_SMTP_PASSWORD;
const ADMIN_EMAIL_SETTING = {
    host: 'smtp.daum.net',
    port: 465,
    secure: true,
    dkim: {
        domainName: 'smus.co.kr',
        keySelector: 'admin1',
        privateKey: ADMIN1_PRIVATE_KEY,
    },
    auth: {
        user: 'admin@smus.co.kr',
        pass: DAUM_SMTP_PASSWORD,
    },
};

//학번+제목+이메일의 HTML내용으로 이메일을 보낸다.
exports.sendEmailUseSchoolId = (school_id, subject, htmlContent) => {
    const emailTo = school_id + '@sangmyung.kr';
    try {
        const transporter = nodemailer.createTransport(ADMIN_EMAIL_SETTING);
        transporter.sendMail(
            {
                from: 'SMUS - 스뮤즈 관리자 계정 <admin@smus.co.kr>',
                to: emailTo,
                subject: subject,
                html: htmlContent,
            },
            (error, info) => {
                if (error) {
                    throw new Error('Send Email Callback Error: ' + error);
                }
            }
        );
    } catch (error) {
        console.error('Send Email Error: ' + error);
    }
};
