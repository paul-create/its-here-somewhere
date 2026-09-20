const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { randomUUID } = require('crypto');
require('dotenv').config();

const s3Client = new S3Client({ region: 'eu-west-2' });
const bucketName = process.env.S3_BUCKET_NAME;

async function uploadPhotoToS3(file, itemId) {
  const key = `items/${itemId}/${randomUUID()}-${file.originalname}`;

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype
  });

  try {
    await s3Client.send(command);
    const s3Url = `https://${bucketName}.s3.eu-west-2.amazonaws.com/${key}`;
    return { s3Key: key, s3Url };
  } catch (err) {
    throw new Error(`S3 upload failed: ${err.message}`);
  }
}

module.exports = { uploadPhotoToS3 };