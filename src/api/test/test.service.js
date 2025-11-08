import { asyncLocalStorage } from '../../services/als.service.js'
import { logger } from '../../services/logger.service.js'

import { runExerciseTests } from '../../test-runner.js'
import { generateReport } from '../../services/report.service.js'
import { userService, ACTIVITY_TYPE } from '../user/user.service.js'

export async function executeTest({ exerciseId, studentName, filePath }) {
    const { loggedinUser } = asyncLocalStorage.getStore()
    
    try {
        const { results } = await runExerciseTests({ exerciseId, filePath })
        const studentResult = formatStudentResult(studentName, exerciseId, results)
        
        const reportOptions = { saveToFile: false, isSingleExercise: true }
        const prmHtmlReport = generateReport([studentResult], 'htmlDetailedPug', reportOptions)
        const prmAddActivities = userService.addActivities(loggedinUser._id, [studentResult], ACTIVITY_TYPE.TEST)    
    
        const [htmlReport] = await Promise.all([prmHtmlReport, prmAddActivities])
        return htmlReport

    } catch (error) {
        logger.error('Error executing test:', error)
        throw error
    }
}

function formatStudentResult(studentName, exerciseId, results) {
    // TODO: This needs to be re-thought

    return {
        name: studentName,
        folderPath: '',
        testResults: { [exerciseId]: results, },
        scores: {
            submissionRate: 1,
            exerciseScore: results.score || 0,
            normalizedScore: results.score || 0,
            submittedCount: 1,
            totalExercises: 1,
            successfulCount: results.success ? 1 : 0,
            successRate: results.success ? 1 : 0,
        },
    }
}