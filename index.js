require('dotenv').config();

const express = require('express'),
  app = express()
const cors = require('cors');
app.use(cors());


const { 
  S3Client, 
  ListObjectsV2Command, 
  PutObjectCommand, 
  GetObjectCommand 
} = require('@aws-sdk/client-s3');

const fs = require('fs');
const fileUpload = require('express-fileupload');
const path = require('path');
const port = 3000;

// AWS S3 client configuration
const s3Client = new S3Client({
    region: process.env.AWS_REGION || 'us-east-1', 
});

// Bucket name 
const BUCKET_NAME = process.env.BUCKET_NAME || 'achievement-two'; 

// Middleware for handling file uploads
app.use(fileUpload());

// Ensure the uploads directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}


// Endpoint to list all objects in the S3 bucket
app.get('/list-objects', (req, res) => {
    const listObjectsParams = {
        Bucket: BUCKET_NAME
    };

    s3Client.send(new ListObjectsV2Command(listObjectsParams)).then(
        (listObjectsResponse) => {
            res.send(listObjectsResponse);
        }
    ).catch((err) => {
        res.status(500).send('Error listing objects: ' + err.message);
    });
});

// Endpoint to upload an object to the S3 bucket
app.post('/upload', (req, res) => {
    const file = req.files.image;  // Get the uploaded file from the request
    const fileName = req.files.image.name;

    const uploadParams = {
        Bucket: BUCKET_NAME,
        Key: fileName, // Using the file name as the S3 key
        Body: file.data // Use the file data to upload
    };

    s3Client.send(new PutObjectCommand(uploadParams)).then(() => {
        res.json({ message: 'File uploaded successfully!' });
    }).catch((err) => {
        res.status(500).send('Error uploading file: ' + err.message);
    });
});

// Endpoint to retrieve an object from the S3 bucket
app.get('/download/:filename', async (req, res) => {
    const { filename } = req.params;

    const downloadParams = {
        Bucket: BUCKET_NAME,
        Key: filename
    };

    try {
        const data = await s3Client.send(new GetObjectCommand(downloadParams));
        data.Body.pipe(res); // Stream the object to the response
    } catch (error) {
        console.error(error);
        res.status(500).send('Error downloading the file');
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});