import fs from 'fs'

import * as testService from '../../services/test.service.js'
import { generateReport } from '../../services/report.service.js'
import { userService, ACTIVITY_TYPE } from '../user/user.service.js'

export async function handleSubmission(req, res) {
    const validation = validateTestRequest(req)

    if (!validation.valid) {
        res.status(validation.statusCode).json({ error: validation.error })
        return
    }

    const filePath = req.file.path

    try {
        const result = await testService.execute(req.body.exerciseId, filePath)

        const studentResult = {
            name: req.loggedinUser.fullname,
            folderPath: '',
            testResults: { [req.body.exerciseId]: result },
            scores: {
                submissionRate: 1,
                normalizedScore: result.normalizedScore || 0,
                submittedCount: 1,
                totalExercises: 1,
                successfulCount: result.success ? 1 : 0,
                successRate: result.success ? 1 : 0,
            },
        }

        const reportOptions = { saveToFile: false, isSingleExercise: true }
        const prmHtmlReport = generateReport([studentResult], 'htmlDetailedPug', reportOptions)

        const activities = [studentResult]
        if (req.body.runnerLog) {
            const runnerLog = JSON.parse(req.body.runnerLog)
            activities.push(...runnerLog)
        }
        const prmAddActivities = userService.addActivities(req.loggedinUser._id, activities, ACTIVITY_TYPE.TEST)

        const [htmlReport] = await Promise.all([prmHtmlReport, prmAddActivities])

        res.setHeader('Content-Type', 'text/html')
        res.send(htmlReport)
        
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