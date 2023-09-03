const ejs = require('ejs');

//보낼 이메일 내용을 랜더링한다.
exports.renderAuthEmail = async (authUrl) => {
    try {
        let emailTemplete;
        await ejs.renderFile('./public/authEmailFormat.ejs', { auth_url: authUrl }, function (err, data) {
            if (err) {
                throw new Error(err);
            }
            emailTemplete = data;
        });
        return emailTemplete;
    } catch (error) {
        console.error('ejs.renderFile Error: ', error);
    }
};

exports.rendernewPasswordEmail = async (newPassword) => {
    try {
        let emailTemplete;
        await ejs.renderFile('./public/newPasswordEmailFormat.ejs', { new_password: newPassword }, function (err, data) {
            if (err) {
                throw new Error(err);
            }
            emailTemplete = data;
        });
        return emailTemplete;
    } catch (error) {
        console.error('ejs.renderFile Error: ', error);
    }
};
