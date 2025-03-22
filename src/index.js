import path from 'path'
import promptSync from 'prompt-sync'
import fs from 'fs'

import { findStudentFolders, getStudentExercises } from './fileUtils.js'
import { testStudentExercises, calculateStudentScores } from './testRunner.js'
import { generateReport } from './reportGenerator.js'
import { parseNumRange } from './utils.js'

// TODO: Use terminal-kit for prompts and better output
// TODO: Use command-line-args for command line arguments

const prompt = promptSync({ sigint: true })

async function main() {
	console.log('Student Assignment Testing Suite')
	console.log('==============================\n')

    const { submissionsPath, exerciseRangeInput } = promptInput()
	const exerciseNumbers = parseNumRange(exerciseRangeInput)

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
		calculateStudentScores(studentResults, exerciseNumbers.length)
        
		// Write student results to JSON file
		const resultsPath = path.join(process.cwd(), 'student-results.json')
		fs.writeFileSync(resultsPath, JSON.stringify(studentResults, null, 4))

		// Generate and save report
        generateReport(studentResults)
	} catch (error) {
		console.error('Error during evaluation:', error)
	}
}

function promptInput() {
	// Get submissions folder from user
	// const rawSubmissionsPath = prompt('Enter the path to the student submissions folder: ')
	// const submissionsPath = cleanPath(rawSubmissionsPath)
	const submissionsPath = '../CaFeb25-ExerciseSubmission/{student:*}/Day1-10-ExRunner/**/ex'

	if (!submissionsPath) {
		console.error('No submissions path provided. Exiting.')
		return
	}

	// Get exercise range from user
	const exerciseRangeInput = '1-5, 7-15'
	// const exerciseRangeInput = prompt('Enter the range of exercises to test (e.g., 1-10): ')
	// if (!exerciseRangeInput) {
	// 	console.error('No exercise range provided. Exiting.')
	// 	return
	// }
    return { submissionsPath, exerciseRangeInput }
}

main()
