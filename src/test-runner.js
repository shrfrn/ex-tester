import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

import { validateCodeQuality } from './validators/code-quality.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

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

// Run tests for an exercise
export async function runTests(exerciseId, studentScript) {
    const testScriptPath = path.join(__dirname, 'exercise-tests', `${exerciseId}.test.js`)

    console.log('Running tests ', testScriptPath)

    try {
        const { test } = await import(`file://${testScriptPath}`)
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
