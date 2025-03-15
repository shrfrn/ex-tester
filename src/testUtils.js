import path from 'path'
import vm from 'vm'

import { mockPrompt, mockAlert, mockConsoleLog, resetMocks, setPromptResponses, getAlertMessages, getConsoleMessages, getCallCounts } from './mockBrowser.js'

export { 
    runCode, 
    runTests, 
    outputContains, 
    outputMatches, 
    outputContainsAll, 
    outputContainsNumber, 
}

async function runTests(exerciseId) {
	const testScript = '../__tests__/' + String(exerciseId).padStart(2, '0') + '.test.js'

    const config = {
        testEnvironment: 'node',
        // rootDir: '../__tests__/', // Ensures Jest runs in the right directory
        testMatch: [path.resolve(process.cwd(), '__tests__/01.test.js')],
        verbose: false,
      }

    try {
        const results = await runCLI(config, [process.cwd()])
    } catch (error) {
        console.log(error)
    }

    console.log(results)
	return {
		success: true,
		consoleOutput: getConsoleMessages(),
		alertOutput: getAlertMessages(),
		allOutput: [...getConsoleMessages(), ...getAlertMessages()],
		callCounts: getCallCounts(),
		variables: {
			declared: Array.from(declaredVariables),
			accessed: Array.from(accessedVariables),
		},
	}
}

// Run a student's code in a sandbox environment
function runCode(code, inputs = [], functionName = null) {
	resetMocks()

	// Create sandbox with mocked browser functions
	const sandbox = {
		console: { log: mockConsoleLog },
		alert: mockAlert,
		prompt: mockPrompt,

		document: {},
		window: {},

		// Some security precautions
		require: undefined,
		import: undefined,
		Promise: undefined,
		fetch: undefined,
		XMLHttpRequest: undefined,
	}

	// Add global object references
	sandbox.global = sandbox
	sandbox.window.document = sandbox.document

	// Setup variable tracking
	const declaredVariables = new Set()
	const accessedVariables = new Set()

	// Track variable usage through proxies
	const originalDefineProperty = Object.defineProperty
	sandbox.Object = {
		...Object,
		defineProperty: function (obj, prop, descriptor) {
			if (obj === sandbox && typeof prop === 'string') {
				declaredVariables.add(prop)
			}
			return originalDefineProperty(obj, prop, descriptor)
		},
	}

	// Create a handler for the vm context
	const handler = {
		get: function (target, prop) {
			if (typeof prop === 'string' && !prop.startsWith('_') && !['console', 'alert', 'prompt', 'document', 'window'].includes(prop)) {
				accessedVariables.add(prop)
			}
			return target[prop]
		},
		set: function (target, prop, value) {
			if (typeof prop === 'string' && !prop.startsWith('_')) {
				declaredVariables.add(prop)
			}
			target[prop] = value
			return true
		},
	}

    if (!functionName) setPromptResponses(inputs)

	// Execute the code
	try {
		const script = new vm.Script(code)
		const context = vm.createContext(new Proxy(sandbox, handler))
		script.runInContext(context, { timeout: 500 })

        if (functionName) {
            if (typeof context[functionName] !== 'function') {
                throw new Error(`Function ${functionName} not found`)
            }
            resetMocks()
            context[functionName](...inputs)
        }

		return {
			success: true,
			consoleOutput: getConsoleMessages(),
			alertOutput: getAlertMessages(),
			allOutput: [...getConsoleMessages(), ...getAlertMessages()],
			callCounts: getCallCounts(),
			variables: {
				declared: Array.from(declaredVariables),
				accessed: Array.from(accessedVariables),
			},
		}
	} catch (error) {
		return {
			success: false,
			error: error.message,
			consoleOutput: getConsoleMessages(),
			alertOutput: getAlertMessages(),
			allOutput: [...getConsoleMessages(), ...getAlertMessages()],
			callCounts: getCallCounts(),
			variables: {
				declared: Array.from(declaredVariables),
				accessed: Array.from(accessedVariables),
			},
		}
	}
}

// Check if any output contains text (case insensitive, flexible matching)
function outputContains(outputs, text) {
	const lowerText = text.toLowerCase()
	return outputs.some(output => output.toLowerCase().includes(lowerText))
}

// Check if any output matches a regular expression pattern
function outputMatches(outputs, pattern) {
	return outputs.some(output => pattern.test(output))
}

// Check if outputs contain all required texts (with flexible matching)
function outputContainsAll(outputs, requiredTexts) {
	return requiredTexts.every(text => outputContains(outputs, text))
}

// Check if output contains any number close to the expected value (within tolerance)
function outputContainsNumber(outputs, expectedNumber, tolerance = 0.01) {
	// Extract all numbers from outputs
	const numbers = []
	outputs.forEach(output => {
		const matches = output.match(/-?\d+(\.\d+)?/g)
		if (matches) {
			matches.forEach(match => numbers.push(parseFloat(match)))
		}
	})

	return numbers.some(number => Math.abs(number - expectedNumber) <= tolerance)
}