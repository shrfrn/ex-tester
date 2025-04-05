import fs from 'fs'
import { validateCodeQuality } from '../tests/codeQuality.test.js'

// Run tests for all exercises of a student
export async function testStudentExercises(studentFolder, exerciseFiles) {
	const results = {}

	await Promise.all(exerciseFiles.map(async exerciseFile => {
        const studentScript = studentFolder + '/' + exerciseFile
        const exerciseId = String(parseInt(exerciseFile)).padStart(2, '0')

		if (fs.existsSync(studentScript)) {
			results[exerciseId] = await _runTests(exerciseId, studentScript)
		} else {
			results[exerciseId] = { submitted: false }
		}
    }))

	return results
}

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

		// const finalScore = submissionRate * normalizedScore
		
		// Add scores to student results
		student.scores = {
			submissionRate,
			exerciseScore,
			normalizedScore,
			// finalScore,
			submittedCount: submittedExercises.length,
			totalExercises: exerciseCount,
			successfulCount: successfulExecutions.length,
			successRate
		}
	}
	
	return studentResults
}

async function _runTests(exerciseId, studentScript) {
	const testScriptPath = '../tests/' + String(exerciseId).padStart(2, '0') + '.test.js'

    console.log('Running tests ', testScriptPath)
	const { test } = await import(testScriptPath)
	const results = test(studentScript)

    const codeQuality = validateCodeQuality(studentScript)
    results.codeQuality = codeQuality

	return results
}
