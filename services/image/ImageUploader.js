const aws = require('aws-sdk');
const multer = require('multer');
const multerS3 = require('multer-s3');
const path = require('path');

const allowedExtensions = ['.png', '.jpg', '.jpeg', '.bmp'];

//aws 설정 및 s3객체 생성 함수
const s3 = () => {
    aws.config.update({
        region: process.env.S3_REGION,
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    });
    return new aws.S3();
};

//이미지 업로드 함수
exports.imageUploader = multer({
    storage: multerS3({
        s3: s3(),
        bucket: process.env.S3_BUCKET,
        key: (req, file, callback) => {
            const extension = path.extname(file.originalname);
            if (!allowedExtensions.includes(extension)) {
                return callback(new Error('잘못된 형식의 파일입니다.')); //이미지파일이 아닌경우 에러
            }
            callback(null, `userProfile/${Date.now()}_${file.originalname}`); //s3내 저장될 경로 설정하기!!
        },
        acl: 'public-read-write',
    }),
});

//이미지 삭제 함수
exports.imageRemover = (imageUrls) => {
    if (!imageUrls) {
        return;
    }
    const S3Bucket = s3();
    const bucketName = process.env.S3_BUCKET;

    const urlArray = imageUrls.split(',');

    urlArray.forEach((imageUrl) => {
        //파일의 위치만 추출
        const key = imageUrl.replace(`https://${bucketName}.s3.amazonaws.com/`, '');
        S3Bucket.deleteObject({ Bucket: bucketName, Key: key });
    });
};
