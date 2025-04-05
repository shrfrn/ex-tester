import fs from 'fs'
import path from 'path'
import { validateCodeQuality } from '../tests/codeQuality.test.js'
import { generateReport } from './reportGenerator.js'

// Unified function to run tests for exercises
export async function runExerciseTests(options) {
    const results = {}

    // Normalize input to handle both single and multiple exercises
    const exercisesToTest = []

    // Case 1: Single exercise with direct file path
    if (options.exerciseId && options.filePath) {
        exercisesToTest.push({
            exerciseId: options.exerciseId,
            filePath: options.filePath
        })
    }
    // Case 2: Multiple exercises from a student folder
    else if (options.studentFolder && options.exerciseFiles) {
        options.exerciseFiles.forEach(file => {
            exercisesToTest.push({
                exerciseId: String(parseInt(file)),
                filePath: path.join(options.studentFolder, file)
            })
        })
    }
    else {
        throw new Error('Invalid input parameters for runExerciseTests')
    }

    // Process all exercises in parallel
    await Promise.all(exercisesToTest.map(async exercise => {
        const formattedExerciseId = String(parseInt(exercise.exerciseId)).padStart(2, '0')

        if (fs.existsSync(exercise.filePath)) {
            results[formattedExerciseId] = await _runTests(formattedExerciseId, exercise.filePath)
        } else {
            results[formattedExerciseId] = { submitted: false }
        }
    }))

    // For single exercise case, return in the expected format
    if (options.exerciseId && options.filePath) {
        const formattedExerciseId = String(parseInt(options.exerciseId)).padStart(2, '0')
        return {
            exerciseId: formattedExerciseId,
            results: results[formattedExerciseId]
        }
    }

    return results
}

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
        let maxScore = 0

        for (const exercise of submittedExercises) {
            const result = student.testResults[exercise]
            if (result && typeof result.score === 'number' && typeof result.weight === 'number') {
                const codeQualityFactor = (100 + result.codeQuality.score) / 100
                result.score = Math.round(result.score * codeQualityFactor)

                totalWeightedScore += result.score * result.weight
                totalWeight += result.weight
                maxScore += result.maxScore
            }
        }

        // Calculate final score
        const exerciseScore = totalWeightedScore / totalWeight
        const normalizedScore = Math.round((totalWeightedScore / maxScore) * 100)

        // Add scores to student results
        student.scores = {
            submissionRate,
            exerciseScore,
            normalizedScore,
            submittedCount: submittedExercises.length,
            totalExercises: exerciseCount,
            successfulCount: successfulExecutions.length,
            successRate
        }
    }

    return studentResults
}

// Run tests for an exercise
async function _runTests(exerciseId, studentScript) {
    const testScriptPath = path.join('..', 'tests', `${exerciseId}.test.js`)

    console.log('Running tests ', testScriptPath)
    try {
        const { test } = await import(testScriptPath)
        const results = test(studentScript)

        // Add student code to results
        results.studentCode = fs.readFileSync(studentScript, 'utf8')

        // Add code quality analysis
        const codeQuality = validateCodeQuality(studentScript)
        results.codeQuality = codeQuality

        return results
    } catch (error) {
        console.error(`Error running tests for ${exerciseId}:`, error)
        return {
            submitted: true,
            success: false,
            error: error.message,
            codeQuality: { score: 0, results: [] }
        }
    }
}
