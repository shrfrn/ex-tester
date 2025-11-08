import fs from 'fs'

import { executeTest } from './test.service.js'

export async function runTest(req, res) {
    const validation = validateTestRequest(req)

    if (!validation.valid) {
        res.status(validation.statusCode).json({ error: validation.error, })
        return
    }

    const exerciseId = req.body.exerciseId
    const studentName = req.body.studentName || 'Anonymous'
    const filePath = req.file.path

    try {
        const htmlReport = await executeTest({ exerciseId, studentName, filePath })

        res.setHeader('Content-Type', 'text/html')
        res.send(htmlReport)
        return
    } catch (error) {
        console.error('Error processing test:', error)
        res.status(500).json({
            error: 'Failed to process test',
            details: error.message,
        })
    } finally {
        if (filePath) cleanupUploadedFile(filePath)
    }
}

function validateTestRequest(req) {
    if (!req.file) {
        return { valid: false, error: 'No file uploaded', statusCode: 400 }
    }

    const exerciseId = req.body.exerciseId

    if (!exerciseId) {
        return { valid: false, error: 'Exercise ID is required', statusCode: 400 }
    }

    return { valid: true }
}

function cleanupUploadedFile(filePath) {
    fs.unlink(filePath, err => {
        if (!err) return
        console.error('Error deleting temporary file:', err)
    })
}