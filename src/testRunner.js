import path from 'path'
import { runTests } from './testUtils.js'

export { 
    testStudentExercises,
    testExercise, 
    runTests,
}

// Run tests for all exercises of a student
function testStudentExercises(studentFolder, exerciseFiles) {
	const results = {}

	exerciseFiles.forEach(async exerciseFile => {
        const exerciseFile = studentFolder + '/' + exerciseFile
        const exerciseId = parseInt(exerciseFile)

		if (await path.exists(exerciseFile)) {
			results[exerciseId] = await runTests(exerciseId, exerciseFile)
		} else {
			results[exerciseId] = { submitted: false }
		}
    })

	return results
}

async function runTests(exerciseId, exerciseFile) {
	const testScriptPath = '../tests/' + String(exerciseId).padStart(2, '0') + '.test.js'

	const { test } = await import(testScriptPath)
	const results = test(exerciseFile)

	console.log(results)
	return results
}

