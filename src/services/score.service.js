// Calculate scores for a student based on test results
export function calculateStudentScores(studentResults, exerciseCount) {
    for (const student of studentResults) {
        const exercises = Object.keys(student.testResults)

        // Count submitted exercises
        const submittedExercises = exercises.filter(ex =>
            student.testResults[ex] && student.testResults[ex].submitted !== false
        )

        const submissionRate = submittedExercises.length / exerciseCount

        // Count successfully executed exercises
        const successfulExecutions = exercises.filter(ex =>
            student.testResults[ex] &&
            student.testResults[ex].submitted !== false &&
            student.testResults[ex].success === true
        )

        const successRate = successfulExecutions.length / exerciseCount

        // Calculate weighted score for submitted exercises
        let totalWeightedScore = 0
        let totalWeight = 0

        for (const exercise of submittedExercises) {
            const result = student.testResults[exercise]

            if (result && typeof result.score === 'number' && typeof result.weight === 'number' && typeof result.maxScore === 'number') {
                // First normalize the raw score to 0-100%
                let normalizedScore = Math.min(100, Math.round((result.score / result.maxScore) * 100))
                
                // Apply code quality factor (capped to avoid scores over 100%)
                const codeQualityFactor = (100 + result.codeQuality.score) / 100
                normalizedScore = Math.min(100, Math.round(normalizedScore * codeQualityFactor))
                
                // Store the normalized score in the result
                result.normalizedScore = normalizedScore
                
                // Calculate weighted score contribution
                totalWeightedScore += normalizedScore * result.weight
                totalWeight += result.weight
            }
        }

        // Calculate final score (0-100)
        const normalizedScore = totalWeight > 0 ? Math.round(totalWeightedScore / totalWeight) : 0

        // Add scores to student results
        student.scores = {
            submissionRate,
            normalizedScore,
            submittedCount: submittedExercises.length,
            totalExercises: exerciseCount,
            successfulCount: successfulExecutions.length,
            successRate
        }
    }

    return studentResults
}

