import path from 'path'

import { readFileAsync } from './fileUtils.js'
import { runTests } from './testUtils.js'

// Run a single test for a student's exercise
const testExercise = async (exerciseId, studentFolder) => {
	try {
		// Store the original file path for later use
		process.env.CURRENT_STUDENT_FILE_PATH = studentFolder

		const results = await runTest(exerciseId)
		return results
	} catch (error) {
		return {
			runs: false,
			correct: false,
			errorMessage: error.message,
		}
	}
}

// Run tests for all exercises of a student
const testStudentExercises = async (studentFolder, exerciseFiles, exerciseRange) => {
	const results = {}
	const [start, end] = exerciseRange

	for (let i = start; i <= end; i++) {
		const exerciseId = String(i).padStart(2, '0')
		const fileName = `${exerciseId}.js`

		if (exerciseFiles.includes(fileName)) {
			results[exerciseId] = await testExercise(exerciseId, studentFolder)
		} else {
			results[exerciseId] = { submitted: false }
		}
	}

	return results
}

export { testExercise, testStudentExercises }
