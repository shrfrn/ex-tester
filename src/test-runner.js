import fs from 'fs'
import path from 'path'
import { validateCodeQuality } from '../tests/codeQuality.test.js'
import { generateReport } from './services/report.service.js'

// Unified function to run tests for exercises (sequential execution)
export async function runExerciseTests({ exerciseId, filePath, studentFolder, exerciseFiles }) {
    const testResults = {}

    // Case 1: Single exercise with direct file path
    if (exerciseId && filePath) {
        const formattedExerciseId = String(parseInt(exerciseId)).padStart(2, '0')
        
        if (fs.existsSync(filePath)) {
            testResults[formattedExerciseId] = await runTests(formattedExerciseId, filePath)
        } else {
            testResults[formattedExerciseId] = { submitted: false }
        }

        // Return in the format expected by server endpoint
        return {
            exerciseId: formattedExerciseId,
            results: testResults[formattedExerciseId],
        }
    }
    
    // Case 2: Multiple exercises from a student folder (sequential)
    if (studentFolder && exerciseFiles) {
        for (const file of exerciseFiles) {
            const exerciseId = String(parseInt(file)).padStart(2, '0')
            const filePath = path.join(studentFolder, file)
            
            if (fs.existsSync(filePath)) {
                testResults[exerciseId] = await runTests(exerciseId, filePath)
            } else {
                testResults[exerciseId] = { submitted: false }
            }
        }
        
        return testResults
    }

    throw new Error('Invalid input parameters for runExerciseTests')
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

// Run tests for an exercise
export async function runTests(exerciseId, studentScript) {
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
        
        // Ensure score is never over maxScore (fallback to percentage if maxScore is missing)
        if (typeof results.score === 'number' && typeof results.maxScore === 'number') {
            results.score = Math.min(results.score, results.maxScore)
            // Calculate raw percentage without code quality adjustments
            results.percentage = Math.round((results.score / results.maxScore) * 100)
        }

        return results
    } catch (error) {
        console.error(`Error running tests for ${exerciseId}:`, error)
        return {
            submitted: true,
            success: false,
            error: error.message,
            codeQuality: { score: 0, results: [] },
            score: 0,
            maxScore: 100,
            percentage: 0
        }
    }
}
