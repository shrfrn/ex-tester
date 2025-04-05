import path from 'path'
import fs from 'fs'

import { findStudentFolders, getStudentExercises } from './fileUtils.js'
import { runExerciseTests, calculateStudentScores } from './core.js'
import { generateReport } from './reportGenerator.js'
import { parseNumRange } from './utils.js'
import { promptInput } from './promptUtils.js'

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

		const resultsPath = path.join(process.cwd(), 'student-results.json')
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
