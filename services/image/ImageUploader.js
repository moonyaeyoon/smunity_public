const aws = require('aws-sdk');
const multer = require('multer');
const multerS3 = require('multer-s3');
const path = require('path');
const { DELETE_S3 } = require('../../constants/resSuccessJson');
const { NO_IMAGE } = require('../../constants/resErrorJson');
const allowedExtensions = ['.png', '.jpg', '.jpeg', '.bmp', '.PNG'];

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
    limits: {
        fileSize: 1024 * 1024 * 1, // 5MB 이하로 제한 (원하는 크기로 수정)
    },
});

//이미지 삭제 함수
exports.imageRemover = async (req, res) => {
    try {
        const imageUrls = req.body.image;
        if (!imageUrls) {
            return res.status(NO_IMAGE.status_code).json(NO_IMAGE.res_json);
        }
        const S3Bucket = s3();
        const bucketName = process.env.S3_BUCKET;

        const urlArray = await imageUrls.split(',');

        await Promise.all(
            urlArray.map(async (imageUrl) => {
                //파일의 이름만 추출
                const key = imageUrl.replace(process.env.COMMON_FILE_URL, '');
                const result = await S3Bucket.deleteObject({ Bucket: bucketName, Key: key }).promise();
            })
        );
        return res.status(DELETE_S3.status_code).json(DELETE_S3.res_json);
    } catch (err) {
        console.error(err);
    }
};
