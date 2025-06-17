import vm from 'vm'
import { mockPrompt, mockAlert, mockConsoleLog, mockConsoleTable, mockSetInterval, mockClearInterval, resetMocks, setPromptResponses, getAlertMessages, getConsoleMessages, getConsoleTables, getCallCounts, getActiveIntervalIds } from './mock-browser.service.js'

let context = null

//
// Part 1: TestCollector functions
//

export function createTestCollector() {
    const results = {
        passed: [],
        failed: [],
        score: 0,
        count: 0,
        maxScore: 0,
    }

    function checkAndRecord(description, condition, score = 10) {
        results.count++
        results.maxScore += score

        if (typeof condition === 'function') condition = condition()

        if (condition) {
            results.score += score
            results.passed.push({ description, score })
        } else {
            results.failed.push({ description, score })
        }
        return condition
    }

    function getResults() {
        return {
            ...results,
            percentage: Math.round((results.score / results.maxScore) * 100)
        }
    }

    return { checkAndRecord, getResults }
}

//
// Part 2: TestUtils functions
//

// Run a student's code in a sandbox environment
export function runScript(code, inputs = []) {
	let results = {}

	try {
		_runInContext(code, inputs)

		results.success = true
	} catch (error) {
        console.log(error)
		results.success = false
		results.error = error.message
	} finally {
		results = { ...results, context, ..._getSideEffects() }
		return results
	}
}

// Run a student's code in a sandbox environment
export function runFunction(functionName, inputs = []) {
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

export function checkReturnValueType(returnValue, expectedType, allowNullish = false) {
	// Check if returnValue exists, unless nullish values are allowed
	if ((returnValue === undefined || returnValue === null) && !allowNullish) return false

	// If we allow nullish and the value is nullish, return true
	if ((returnValue === undefined || returnValue === null) && allowNullish) return true

	// Type checking
	switch(expectedType.toLowerCase()) {
		case 'string':
			return typeof returnValue === 'string'
		case 'number':
			return typeof returnValue === 'number'
		case 'boolean':
			return typeof returnValue === 'boolean'
		case 'array':
			return Array.isArray(returnValue)
		case 'object':
			return typeof returnValue === 'object' && !Array.isArray(returnValue)
		case 'function':
			return typeof returnValue === 'function'
		case 'any':
			return true
		default:
			return false
	}
}

// Check if a function with the specified name and parameter count exists in the code
export function hasFunctionWithSignature(functionName, expectedParamCount) {
    // Check if the context has been initialized
    if (!context) throw new Error('Context not initialized')

    // Check if the function exists in the context
    if (typeof context[functionName] !== 'function') return false

    // Get the function's string representation
    const functionStr = context[functionName].toString()

    // Extract parameter list using regex
    const paramListMatch = functionStr.match(/function\s*[^(]*\(\s*([^)]*)\s*\)/) ||
                           functionStr.match(/\(\s*([^)]*)\s*\)\s*=>/)

    if (!paramListMatch) return false

    // Count parameters (handling empty parameter list)
    const paramList = paramListMatch[1].trim()
    const actualParamCount = paramList === '' ? 0 : paramList.split(',').length

    return actualParamCount === expectedParamCount
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
		console: {
			log: mockConsoleLog,
			table: mockConsoleTable
		},
		alert: mockAlert,
		prompt: mockPrompt,
		setInterval: mockSetInterval,
		clearInterval: mockClearInterval,

        ..._getDeafultContext(),

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
    const excludedProps = ['console', 'alert', 'prompt', 'document', 'window', 'declaredVariables', 'accessedVariables']
	const handler = {
		get: function (target, prop) {
			if (typeof prop === 'string' && !prop.startsWith('_') && !excludedProps.includes(prop)) {
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
		tableOutput: getConsoleTables(),
		allOutput: [...getConsoleMessages(), ...getAlertMessages()],
		callCounts: getCallCounts(),
		variables: {
			declared: Array.from(context.declaredVariables),
			accessed: Array.from(context.accessedVariables),
		},
		activeIntervalIds: getActiveIntervalIds()
	}
}

function _getDeafultContext() {
    return {
        parseFloat,
        parseInt,
        isNaN,

        Number,
        Math,
        String,
        Boolean,
        Object,
        Array,
        Date,

        setTimeout,
        clearTimeout,
    }
} 