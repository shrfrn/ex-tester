import path from 'path'
import promptSync from 'prompt-sync'
import fs from 'fs'

import { findStudentFolders, getStudentExercises } from './fileUtils.js'
import { testStudentExercises } from './testRunner.js'
import { generateReport } from './reportGenerator.js'

// TODO: Use terminal-kit for prompts and better output
// TODO: Use command-line-args for command line arguments

const prompt = promptSync({ sigint: true })

async function main() {
	console.log('Student Assignment Testing Suite')
	console.log('==============================\n')

	// Get submissions folder from user
	// const rawSubmissionsPath = prompt('Enter the path to the student submissions folder: ')
	// const submissionsPath = cleanPath(rawSubmissionsPath)
	const submissionsPath = '../CaFeb25-ExerciseSubmission/{student:*}/Day1-10-ExRunner/**/ex'

	if (!submissionsPath) {
		console.error('No submissions path provided. Exiting.')
		return
	}

	// Get exercise range from user
	const exerciseRangeInput = '1-2'
	// const exerciseRangeInput = prompt('Enter the range of exercises to test (e.g., 1-10): ')
	// if (!exerciseRangeInput) {
	// 	console.error('No exercise range provided. Exiting.')
	// 	return
	// }

	const exerciseNumbers = parseExerciseRange(exerciseRangeInput)
    const exerciseCount = exerciseNumbers.length

	try {
		const studentResults = []
		const studentFolders = (await findStudentFolders(submissionsPath))

		for (const [index, student] of studentFolders.entries()) {
			console.log(`Processing student ${index + 1}/${studentFolders.length}: ${student.name}`)

			const exerciseFiles = await getStudentExercises(student.path, exerciseNumbers)
			const testResults = await testStudentExercises(student.path, exerciseFiles)

            studentResults.push({
				name: student.name,
				folderPath: student.path,
				testResults,
			})
		}

		// Calculate scores for each student
		calculateStudentScores(studentResults, exerciseCount)
        // console.log(studentResults.map(res => res.scores.finalScore))
        
		// Write student results to JSON file
		const resultsPath = path.join(process.cwd(), 'student-results.json')
		fs.writeFileSync(resultsPath, JSON.stringify(studentResults, null, 4))

		// Generate and save report
        generateReport(studentResults)
	} catch (error) {
		console.error('Error during evaluation:', error)
	}
}

function calculateStudentScores(studentResults, exerciseCount) {
	for (const student of studentResults) {
		const exercises = Object.keys(student.testResults)
		const totalExercises = exerciseCount
		
		// Count submitted exercises
		const submittedExercises = exercises.filter(ex => 
			student.testResults[ex] && student.testResults[ex].submitted !== false
		)
		
		const submissionRate = submittedExercises.length / totalExercises
		
		// Count successfully executed exercises
		const successfulExecutions = exercises.filter(ex => 
			student.testResults[ex] && 
			student.testResults[ex].submitted !== false && 
			student.testResults[ex].success === true
		)
		
		const successRate = successfulExecutions.length / totalExercises
		
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
			totalExercises,
			successfulCount: successfulExecutions.length,
			successRate
		}
	}
	
	return studentResults
}

function parseExerciseRange(input) {
	const numbers = []
	const rangeRegex = /(\d+)\s*-\s*(\d+)|(\d+)/g

	for (const match of input.matchAll(rangeRegex)) {
		const [, rangeStart, rangeEnd, singleNum] = match
		if (rangeStart) {
			// Handle range
			for (let i = Number(rangeStart); i <= Number(rangeEnd); i++) {
				numbers.push(i)
			}
		} else {
			// Handle single number
			numbers.push(Number(singleNum))
		}
	}

	return [...new Set(numbers)].sort((a, b) => a - b)
}

main()
