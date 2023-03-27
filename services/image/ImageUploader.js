const aws = require('aws-sdk');
const multer = require('multer');
const multerS3 = require('multer-s3');
const path = require('path');

aws.config.update({
    region: 'ap-northeast-2',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const s3 = new aws.S3();

const imageUploader = multer({
    storage: multerS3({
        s3: s3,
        bucket: 'smus',
        key: (req, file, callback) =>{
            callback(null, `userProfile/${Date.now()}_${file.originalname}`); //s3내 저장될 경로 설정하기!!
        },
        acl: 'public-read-write'
    }),
});
//업로드 완료시 {imageUrl: ""} 반환됩니다!
module.exports = imageUploader;
