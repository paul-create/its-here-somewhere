const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
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
    // NO ACL - keep it private
  });

  try {
    await s3Client.send(command);
    return { s3Key: key };
  } catch (err) {
    throw new Error(`S3 upload failed: ${err.message}`);
  }
}

async function getSignedPhotoUrl(s3Key, expiresIn = 3600) {
  try {
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: s3Key
    });

    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn });
    return signedUrl;
  } catch (err) {
    throw new Error(`Failed to generate signed URL: ${err.message}`);
  }
}

module.exports = { uploadPhotoToS3, getSignedPhotoUrl };