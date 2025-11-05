import { runExerciseTests } from '../../test-runner.js'
import { generateReport } from '../../services/report.service.js'
import { validateTestRequest } from '../utils/request-validator.js'
import { formatStudentResult } from '../utils/result-formatter.js'
import { cleanupUploadedFile } from '../utils/file-cleanup.js'

export async function handleTestRequest(req, res) {
    try {
        // Validate request
        const validation = validateTestRequest(req)

        if (!validation.valid) {
            return res.status(validation.statusCode).json({ error: validation.error })
        }

        const exerciseId = req.body.exerciseId
        const studentName = req.body.studentName || 'Anonymous'
        const filePath = req.file.path

        // Run the test
        const { results } = await runExerciseTests({ exerciseId, filePath })

        // Format results for report generator
        const studentResult = formatStudentResult(studentName, exerciseId, results)

        // Generate HTML report
        const htmlReport = await generateReport([studentResult], 'htmlDetailedPug', {
            saveToFile: false,
            isSingleExercise: true,
        })

        // Set content type and send response
        res.setHeader('Content-Type', 'text/html')
        res.send(htmlReport)

        // Clean up uploaded file (async, no await)
        cleanupUploadedFile(filePath)
    } catch (error) {
        console.error('Error processing test:', error)
        res.status(500).json({
            error: 'Failed to process test',
            details: error.message,
        })
    }
}

