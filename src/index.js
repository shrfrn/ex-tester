import path from 'path'
import fs from 'fs'

import { findStudentFolders, getStudentExercises } from './services/file-utils.service.js'
import { runExerciseTests, calculateStudentScores } from './test-runner.js'
import { generateReport } from './services/report.service.js'
import { parseNumRange } from './services/util.service.js'
import { promptInput } from './prompt.js'

async function main() {
	console.log('Student Assignment Testing Suite')
	console.log('================================\n')

	const { submissionsPath, exerciseRangeInput, reportType } = await promptInput()
	const exerciseNumbers = parseNumRange(exerciseRangeInput)

	batchTest({ submissionsPath, exerciseNumbers, reportType })
}

async function batchTest({ submissionsPath, exerciseNumbers, reportType = 'htmlDetailed' }) {
	try {
		const studentResults = []
		const studentFolders = await findStudentFolders(submissionsPath)

		for (const student of studentFolders) {
			const exerciseFiles = await getStudentExercises(student.path, exerciseNumbers)
			const testResults = await runExerciseTests({ studentFolder: student.path, exerciseFiles })

			studentResults.push({
				name: student.name,
				folderPath: student.path,
				testResults,
			})
		}
		// TODO: result calc needs to be fixed
		calculateStudentScores(studentResults, exerciseNumbers.length)

		// Create reports directory if it doesn't exist
		const reportsDir = path.join(process.cwd(), 'reports')
		if (!fs.existsSync(reportsDir)) {
			fs.mkdirSync(reportsDir, { recursive: true })
		}

		const resultsPath = path.join(process.cwd(), 'reports', 'student-results.json')
		fs.writeFileSync(resultsPath, JSON.stringify(studentResults, null, 4))

		generateReport(studentResults, reportType)
	} catch (error) {
		console.error('Error during evaluation:', error)
	}
}

// Run the main function
main().catch(error => {
	console.error('Error in main process:', error)
	process.exit(1)
})
