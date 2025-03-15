import path from 'path'
import promptSync from 'prompt-sync'

import { parseAssignmentFiles, findStudentFolders, getStudentExercises } from './fileUtils.js'
import { testStudentExercises } from './testRunner.js'
import { analyzeStudentCodeQuality } from './codeAnalyzer.js'
import { generateReport, saveReport } from './reportGenerator.js'

const prompt = promptSync({ sigint: true })

// Helper function to clean up paths - remove quotes and trim whitespace
const cleanPath = inputPath => {
	if (!inputPath) return inputPath
	return inputPath.replace(/^['"]|['"]$/g, '').trim()
}

const main = async () => {
	//   console.log('Student Assignment Testing Suite')
	//   console.log('==============================\n')

	// Get assignment path from config or use default
	//   const assignmentsPath = cleanPath('/Volumes/Extreme 2T/Dropbox/Teaching/JS-Basics')
	//   console.log(`Reading assignments from: ${assignmentsPath}`)

	// Get submissions folder from user
	//   const rawSubmissionsPath = prompt('Enter the path to the student submissions folder: ')
	//   const submissionsPath = cleanPath(rawSubmissionsPath)
	const submissionsPath = '../CaFeb25-ExerciseSubmission/{student:*}/Day1-10-ExRunner/**/ex'

	//   if (!submissionsPath) {
	//     console.error('No submissions path provided. Exiting.')
	//     return
	//   }

	// Get exercise range from user
	const exerciseRangeInput = '1- 4, 6-8, 12 - 13'
	//   const exerciseRangeInput = prompt('Enter the range of exercises to test (e.g., 1-10): ')
	//   if (!exerciseRangeInput) {
	//     console.error('No exercise range provided. Exiting.')
	//     return
	//   }

	const exerciseNumbers = parseExerciseRange(exerciseRangeInput)

	//   console.log(`\nProcessing exercises ${start} to ${end}...`)

	try {
		// Find student folders
		console.log(`Finding student submission folders in: ${submissionsPath}`)
		const studentFolders = await findStudentFolders(submissionsPath)
		console.log(`Found ${studentFolders.length} student folders.`)
		console.log(studentFolders[0], studentFolders[1])

		// Process each student
		const studentResults = []

		for (const [index, student] of studentFolders.entries()) {
			console.log(`Processing student ${index + 1}/${studentFolders.length}: ${student.name}`)

			// Get exercise files
			const exerciseFiles = await getStudentExercises(student.path, exerciseNumbers)
			console.log(exerciseFiles)

			// Run tests
			const testResults = await testStudentExercises(student.path, exerciseFiles, [1, 1])

			// Analyze code quality
			const codeQualityResults = await analyzeStudentCodeQuality(student.path, exerciseFiles)

			// Calculate metrics
			const exercisesInRange = Object.keys(testResults).filter(key => {
				const num = parseInt(key)
				return num >= start && num <= end
			})

			const submittedExercises = exercisesInRange.filter(key => testResults[key].submitted !== false)

			const runningExercises = submittedExercises.filter(key => testResults[key].runs === true)

			const correctExercises = submittedExercises.filter(key => testResults[key].correct === true)

			// Calculate percentages
			const runPercent = Math.round((runningExercises.length / submittedExercises.length) * 100) || 0
			const correctPercent = Math.round((correctExercises.length / submittedExercises.length) * 100) || 0

			// Add to results
			studentResults.push({
				name: student.name,
				folderPath: student.path,
				exercisesSubmitted: submittedExercises.map(ex => parseInt(ex)),
				runPercent,
				correctPercent,
				codeQuality: codeQualityResults.overallScore,
				testResults,
				qualityResults: codeQualityResults,
			})
		}

		// Generate and save report
		console.log('\nGenerating report...')
		const report = generateReport(studentResults, submissionsPath, [start, end])

		const outputPath = path.join(process.cwd(), 'student-evaluation-report.md')
		saveReport(report, outputPath)

		console.log('\nEvaluation complete!')
	} catch (error) {
		console.error('Error during evaluation:', error)
	}
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

// Start the program
main()
