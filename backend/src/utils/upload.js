const multer = require('multer');
const cloudinary = require('../config/cloudinary');

// Memory storage: the file buffer is streamed straight to Cloudinary and
// never written to the server's disk, per the assessment requirement.
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (/^image\/(jpeg|png|webp|gif)$/.test(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (jpeg, png, webp, gif) are allowed.'));
    }
  },
});

function streamToCloudinary(buffer) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'ecommerce-products' },
      (err, result) => (err ? reject(err) : resolve(result))
    );
    stream.end(buffer);
  });
}

module.exports = { upload, streamToCloudinary };
