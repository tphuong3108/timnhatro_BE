import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinary.js';

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const isImage = file.mimetype.startsWith('image/');
    const isVideo = file.mimetype.startsWith('video/');

    let folder = 'uploads';
    if (isImage) folder = 'uploads/images';
    if (isVideo) folder = 'uploads/videos';

    return {
      folder,
      resource_type: 'auto',
      allowed_formats: ['jpg', 'png', 'jpeg', 'webp', 'mp4', 'mov'],
    };
  },
});

const upload = multer({ storage });

export default upload;
