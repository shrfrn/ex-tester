import fs from 'fs'
import vm from 'vm'

function runScript() {
	const scriptContent = fs.readFileSync('test.js', 'utf8')

	const context = { console }
	vm.createContext(context)

	try {
		const script = new vm.Script(scriptContent)

		// Run with timeout
		script.runInContext(context, { timeout: 500 })

		if (typeof context['foo'] !== 'function') {
			throw new Error(`Function ${'foo'} not found`)
		}

		return context['foo'](1, 2) // Execute the student's function
	} catch (error) {
		return `Error: ${error.message}` // Catch infinite loop errors
	}
}

// Example usage
console.log(runScript('student1.js', 'sum', [2, 3]))
