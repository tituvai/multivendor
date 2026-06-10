const cloudinary = require("cloudinary").v2;
require("dotenv").config();
// Import the filesystem module
const fs = require('fs');

cloudinary.config({ 
        cloud_name: process.env.CLOUD_NAME, 
        api_key: process.env.API_KEY, 
        api_secret: process.env.API_SECRET 
    });

    const uploadImage = async (filename) => {
   const result =  await cloudinary.uploader.upload(filename)
   
   fs.unlinkSync( filename )
   return result;
        
    }


    module.exports=uploadImage