import vm from 'vm'
import { mockPrompt, mockAlert, mockConsoleLog, resetMocks, setPromptResponses, getAlertMessages, getConsoleMessages, getCallCounts } from './mockBrowser.js'

export { 
    runScript, 
    runFunction,
    outputContains, 
    outputMatches, 
    outputContainsAll, 
    outputContainsNumber 
}

let context = null

// Run a student's code in a sandbox environment
function runScript(code, inputs = []) {
	let results = {}

	try {
		_runInContext(code, inputs)

		results.success = true
	} catch (error) {
		results.success = false
		results.error = error.message
	} finally {
		results = { ...results, ..._getSideEffects() }
		return results
	}
}

// Run a student's code in a sandbox environment
function runFunction(functionName, inputs = []) {
	if (!context) throw new Error('Context not initialized')
	if (!context[functionName]) throw new Error(`Function ${functionName} not found`)

	let results = {}
	resetMocks()

	try {
		var returnValue = context[functionName](...inputs)

		results.success = true
		results.returnValue = returnValue
	} catch (error) {
		results.success = false
		results.error = error.message
	} finally {
		results = { ...results, ..._getSideEffects() }
		return results
	}
}

function _runInContext(code, inputs = [], timeout = 500) {
	const sandbox = _initSandbox()
	const script = new vm.Script(code)
    
	context = vm.createContext(sandbox)
    
    setPromptResponses(inputs)
	script.runInContext(context, { timeout })
}

function _initSandbox() {
	resetMocks()

	// Create sandbox with mocked browser functions
	const sandbox = {
		console: { log: mockConsoleLog },
		alert: mockAlert,
		prompt: mockPrompt,

		// Setup variable tracking
		declaredVariables: new Set(),
		accessedVariables: new Set(),

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

	// Track variable usage through proxies
	const originalDefineProperty = Object.defineProperty
	sandbox.Object = {
		...Object,
		defineProperty: function (obj, prop, descriptor) {
			if (obj === sandbox && typeof prop === 'string') {
				obj.declaredVariables.add(prop)
			}
			return originalDefineProperty(obj, prop, descriptor)
		},
	}

	// Create a handler for the vm context
	const handler = {
		get: function (target, prop) {
			if (typeof prop === 'string' && !prop.startsWith('_') && !['console', 'alert', 'prompt', 'document', 'window'].includes(prop)) {
				target.accessedVariables.add(prop)
			}
			return target[prop]
		},
		set: function (target, prop, value) {
			if (typeof prop === 'string' && !prop.startsWith('_')) {
				target.declaredVariables.add(prop)
			}
			target[prop] = value
			return true
		},
	}
	return new Proxy(sandbox, handler)
}

function _getSideEffects() {
	return {
		consoleOutput: getConsoleMessages(),
		alertOutput: getAlertMessages(),
		allOutput: [...getConsoleMessages(), ...getAlertMessages()],
		callCounts: getCallCounts(),
		variables: {
			declared: Array.from(context.declaredVariables),
			accessed: Array.from(context.accessedVariables),
		},
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
