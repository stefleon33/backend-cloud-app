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
const port = 3000;

// LocalStack S3 configuration
const s3Client = new S3Client({
    region: 'us-east-1',
    endpoint: 'http://localhost:4566',
    forcePathStyle: true,
});

// Bucket name
const BUCKET_NAME = 'my-cool-local-bucket';



// Middleware for handling file uploads
app.use(fileUpload());

const path = require('path');

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
  );
});

// Endpoint to upload an object to the S3 bucket
app.post('/upload', (req, res) => {
  console.log(req.files);  // Log the file object to check its structure

  const file = req.files.image;  // Get the uploaded file from the request
  const fileName = req.files.image.name;
  const tempPath = `/tmp/${fileName}`;
  file.mv(tempPath, (err) => {
    if (err) {
      console.error(err);
      res.status(500).send("Error: " + err);
    } else {
      res.json(updateimage);
    }
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
