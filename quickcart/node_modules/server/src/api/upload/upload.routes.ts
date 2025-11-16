import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// --- THIS IS THE FIX ---
// We use process.cwd() (which is 'quickcart/server') to build the path
const uploadDir = path.join(process.cwd(), './public/uploads');
// --- END FIX ---

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, uploadDir); // Save files to 'quickcart/server/public/uploads'
  },
  filename(req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  },
});

function checkFileType(file: Express.Multer.File, cb: multer.FileFilterCallback) {
  const filetypes = /jpeg|jpg|png|gif/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Images only!'));
  }
}

router.post('/', upload.single('image'), (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error('Please upload a file');
  }
  
  const filePath = `/uploads/${req.file.filename}`.replace(/\\/g, '/');
  
  res.status(201).json({
    message: 'Image uploaded successfully',
    imageUrl: filePath,
  });
});

export default router;