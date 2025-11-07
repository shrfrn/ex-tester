import { runExerciseTests } from '../../test-runner.js'
import { generateReport } from '../../services/report.service.js'

export async function executeTest({ exerciseId, studentName, filePath }) {
    const { results } = await runExerciseTests({ exerciseId, filePath })

    const studentResult = formatStudentResult(studentName, exerciseId, results)

    const htmlReport = await generateReport([
        studentResult,
    ], 'htmlDetailedPug', {
        saveToFile: false,
        isSingleExercise: true,
    })

    return htmlReport
}

function formatStudentResult(studentName, exerciseId, results) {
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

