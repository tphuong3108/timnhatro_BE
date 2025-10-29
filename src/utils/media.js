// src/utils/media.js
import cloudinary from '~/config/cloudinary.js'

// Lấy URL từ object file của multer-storage-cloudinary
const fileToUrl = (file) => {
  if (!file) return null
  return file.path || file.secure_url || file.url || file.location || null
}

// Parse chuỗi có thể là JSON hoặc danh sách URL
const normalizePossibleArrayString = (val) => {
  if (!val && val !== '') return []
  if (Array.isArray(val)) return val.filter(Boolean)
  if (typeof val === 'string') {
    const s = val.trim()
    if (!s) return []
    try {
      const parsed = JSON.parse(s)
      if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean)
    } catch {}
    if (s.includes(',')) return s.split(',').map(v => v.trim()).filter(Boolean)
    return [s]
  }
  return []
}

// Upload link (remote URL) lên Cloudinary
const uploadRemoteUrl = async (url, folder = 'uploads') => {
  if (!url) return null
  const res = await cloudinary.uploader.upload(url, {
    folder,
    resource_type: 'auto'
  })
  return res.secure_url || res.url || null
}

// Hàm xử lý file + link (ảnh, video, avatar)
export const processMediaFields = async (req, {
  imageField = 'images',
  videoField = 'videos',
  avatarField = 'avatar',
  uploadFolderImages = 'uploads/images',
  uploadFolderVideos = 'uploads/videos',
  uploadFolderAvatar = 'uploads/avatars'
} = {}) => {
  const result = {}

  // Xử lý ảnh
  const filesImages = (req.files && req.files[imageField]) || []
  const fileImageUrls = filesImages.map(fileToUrl).filter(Boolean)
  const bodyImageUrls = normalizePossibleArrayString(req.body?.[imageField])

  const uploadedImageUrls = []
  for (const link of bodyImageUrls) {
    const uploaded = await uploadRemoteUrl(link, uploadFolderImages)
    if (uploaded) uploadedImageUrls.push(uploaded)
  }
  result[imageField] = [...fileImageUrls, ...uploadedImageUrls]

  // Xử lý video
  const filesVideos = (req.files && req.files[videoField]) || []
  const fileVideoUrls = filesVideos.map(fileToUrl).filter(Boolean)
  const bodyVideoUrls = normalizePossibleArrayString(req.body?.[videoField])

  const uploadedVideoUrls = []
  for (const link of bodyVideoUrls) {
    const uploaded = await uploadRemoteUrl(link, uploadFolderVideos)
    if (uploaded) uploadedVideoUrls.push(uploaded)
  }
  result[videoField] = [...fileVideoUrls, ...uploadedVideoUrls]

  // Xử lý avatar
  const fileAvatar = req.file || (req.files && req.files[avatarField]?.[0])
  let avatarUrl = fileToUrl(fileAvatar)
  if (!avatarUrl && req.body?.[avatarField]) {
    const link = normalizePossibleArrayString(req.body[avatarField])[0]
    if (link) avatarUrl = await uploadRemoteUrl(link, uploadFolderAvatar)
  }
  if (avatarUrl) result[avatarField] = avatarUrl

  return result
}
