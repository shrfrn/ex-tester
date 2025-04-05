import vm from 'vm'
import { mockPrompt, mockAlert, mockConsoleLog, mockConsoleTable, mockSetInterval, mockClearInterval, resetMocks, setPromptResponses, getAlertMessages, getConsoleMessages, getConsoleTables, getCallCounts, getActiveIntervalIds } from './mockBrowser.js'

let context = null

// TODO: Spacial case when student's code is a blank string

// Run a student's code in a sandbox environment
export function runScript(code, inputs = []) {
	let results = {}

	try {
		_runInContext(code, inputs)

		results.success = true
	} catch (error) {
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

// Check if any output contains text (case insensitive, flexible matching)
export function outputContains(outputs, text) {
	const lowerText = text.toLowerCase()
	return outputs.some(output => output.toLowerCase().includes(lowerText))
}

// Check if any output matches a regular expression pattern
export function outputMatches(outputs, pattern) {
	return outputs.some(output => pattern.test(output))
}

// Check if outputs contain all required texts (with flexible matching)
export function outputContainsAll(outputs, requiredTexts) {
	return requiredTexts.every(text => outputContains(outputs, text))
}

// Check if output contains any number close to the expected value (within tolerance)
export function outputContainsNumber(outputs, expectedNumber, tolerance = 0.01) {
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