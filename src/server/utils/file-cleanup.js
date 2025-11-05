import fs from 'fs'

export function cleanupUploadedFile(filePath) {
    fs.unlink(filePath, (err) => {
        if (err) {
            console.error('Error deleting temporary file:', err)
        }
    })
}

