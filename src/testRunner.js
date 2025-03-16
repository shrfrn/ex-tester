import fs from 'fs'

export { 
    testStudentExercises,
    runTests,
}

// Run tests for all exercises of a student
async function testStudentExercises(studentFolder, exerciseFiles) {
	const results = {}

	await Promise.all(exerciseFiles.map(async exerciseFile => {
        const exercisePath = studentFolder + '/' + exerciseFile
        const exerciseId = String(parseInt(exerciseFile)).padStart(2, '0')

		if (fs.existsSync(exercisePath)) {
			results[exerciseId] = await runTests(exerciseId, exercisePath)
		} else {
			results[exerciseId] = { submitted: false }
		}
    }))

	return results
}

async function runTests(exerciseId, exerciseFile) {
	const testScriptPath = '../tests/' + String(exerciseId).padStart(2, '0') + '.test.js'

	const { test } = await import(testScriptPath)
	const results = test(exerciseFile)

	return results
}

