const multer = require("multer");

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './uploads')
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
         cb(null, file.fieldname + '-' + uniqueSuffix + "." + file.originalname.split(".")[1])
    }
})

// Multer middleware
const upload = multer({ storage: storage });

// Handle Multer errors
const handleMulterError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: 'File size is too large. Maximum size is 5MB.'
            });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
                success: false,
                message: 'Too many files uploaded.'
            });
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(400).json({
                success: false,
                message: 'Unexpected file field.'
            });
        }
        return res.status(400).json({
            success: false,
            message: err.message
        });
    }
    
    if (err.message && err.message.includes('Only JPG, PNG, WEBP allowed')) {
        return res.status(400).json({
            success: false,
            message: err.message
        });
    }
    
    next(err);
};

module.exports = upload;
module.exports.upload = upload;
module.exports.handleMulterError = handleMulterError;