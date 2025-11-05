import multer from 'multer'
import path from 'path'
import fs from 'fs'

export function initMulter() {
    const storage = multer.diskStorage({
        destination: function (req, file, cb) {
            const uploadDir = path.join(process.cwd(), 'uploads')

            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true })
            }

            cb(null, uploadDir)
        },
        filename: function (req, file, cb) {
            // Use a timestamp to ensure unique filenames
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
            cb(null, uniqueSuffix + '-' + file.originalname)
        },
    })

    return multer({ storage })
}

