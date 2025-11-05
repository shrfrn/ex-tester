export function formatStudentResult(studentName, exerciseId, results) {
    return {
        name: studentName,
        folderPath: '',
        testResults: {
            [exerciseId]: results,
        },
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

