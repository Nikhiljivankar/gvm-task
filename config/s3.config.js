require('dotenv').config();
const AWS = require('aws-sdk');

const env = {
	AWS_ACCESS_KEY: process.env.AWS_ACCESS_KEY,
	AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
	REGION: process.env.REGION,
	Bucket: process.env.Bucket,
};

const s3Client = new AWS.S3({
	accessKeyId: env.AWS_ACCESS_KEY,
	secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
	region: env.REGION,
});

const uploadParams = {
	Bucket: env.Bucket,
	Key: '', // pass key
	Body: null, // pass file body
};

const s3 = {};
s3.s3Client = s3Client;
s3.uploadParams = uploadParams;

module.exports = s3;
