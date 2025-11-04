import vm from 'vm'
import { 
    mockPrompt, 
    mockConfirm, 
    mockAlert, 
    mockConsoleLog, 
    mockConsoleTable,
    mockConsoleWarn,
    mockConsoleError,
    mockConsoleInfo,
    mockConsoleDebug,
    mockConsoleGroup,
    mockConsoleGroupCollapsed,
    mockConsoleGroupEnd,
    mockConsoleAssert,
    mockConsoleClear,
    mockConsoleDir,
    mockConsoleDirxml,
    mockConsoleTrace,
    mockConsoleCount,
    mockConsoleCountReset,
    mockConsoleTime,
    mockConsoleTimeEnd,
    mockConsoleTimeLog,
    mockSetInterval, 
    mockClearInterval,
    mockSetTimeout,
    mockClearTimeout,
    resetMocks, 
    setPromptResponses, 
    setConfirmResponses, 
    getAlertMessages, 
    getConsoleMessages, 
    getConsoleTables,
    getConsoleWarnings,
    getConsoleErrors,
    getConsoleGroups,
    getCallCounts, 
    getActiveIntervalIds,
    getActiveTimeoutIds
} from './mock-browser.service.js'

let context = null

// Freeze built-in prototypes to prevent pollution
_freezeBuiltInPrototypes()

function _freezeBuiltInPrototypes() {
	// Freeze prototypes to prevent pollution attacks
	Object.freeze(Object.prototype)
	Object.freeze(Array.prototype)
	Object.freeze(String.prototype)
	Object.freeze(Number.prototype)
	Object.freeze(Boolean.prototype)
	Object.freeze(Function.prototype)
	Object.freeze(Date.prototype)
	Object.freeze(Math)
}

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

    // Split inputs between confirm (boolean) and prompt (string) responses
    const confirmInputs = inputs.filter(input => typeof input === 'boolean')
    const promptInputs = inputs.filter(input => typeof input !== 'boolean')
    
    if (confirmInputs.length > 0) setConfirmResponses(confirmInputs)
    if (promptInputs.length > 0) setPromptResponses(promptInputs)
    
	try {
		script.runInContext(context, { timeout })
	} catch (error) {
		// Enhanced timeout error message
		if (error.code === 'ERR_SCRIPT_EXECUTION_TIMEOUT') {
			throw new Error(
				'Code execution timeout (500ms). Common causes:\n' +
				'1. Infinite loop without exit condition\n' +
				'2. Function uses prompt() instead of parameters\n' +
				'3. Sentinel loop waiting for input that never arrives'
			)
		}
		throw error
	}
}

function _initSandbox() {
	resetMocks()

	// Create sandbox with mocked browser functions
	const sandbox = {
		console: {
			log: mockConsoleLog,
			table: mockConsoleTable,
			warn: mockConsoleWarn,
			error: mockConsoleError,
			info: mockConsoleInfo,
			debug: mockConsoleDebug,
			group: mockConsoleGroup,
			groupCollapsed: mockConsoleGroupCollapsed,
			groupEnd: mockConsoleGroupEnd,
			assert: mockConsoleAssert,
			clear: mockConsoleClear,
			dir: mockConsoleDir,
			dirxml: mockConsoleDirxml,
			trace: mockConsoleTrace,
			count: mockConsoleCount,
			countReset: mockConsoleCountReset,
			time: mockConsoleTime,
			timeEnd: mockConsoleTimeEnd,
			timeLog: mockConsoleTimeLog
		},
		alert: mockAlert,
		prompt: mockPrompt,
		confirm: mockConfirm,
		setInterval: mockSetInterval,
		clearInterval: mockClearInterval,
		setTimeout: mockSetTimeout,
		clearTimeout: mockClearTimeout,

        ..._getDeafultContext(),

		// Setup variable tracking
		declaredVariables: new Set(),
		accessedVariables: new Set(),

	document: {
		// Explicitly block dangerous document methods
		write: undefined,
		writeln: undefined,
		cookie: undefined,
	},
	window: {
		// Explicitly block dangerous window methods
		open: undefined,
		location: undefined,
		history: undefined,
	},

	// SECURITY: Block code execution
	eval: undefined,
	Function: undefined,
	GeneratorFunction: undefined,
	AsyncFunction: undefined,
	AsyncGeneratorFunction: undefined,

	// SECURITY: Block Node.js internals
	process: undefined,
	global: undefined,
	Buffer: undefined,

	// SECURITY: Block module system
	require: undefined,
	import: undefined,
	__dirname: undefined,
	__filename: undefined,
	module: undefined,
	exports: undefined,

	// SECURITY: Block async/network operations
	Promise: undefined,
	fetch: undefined,
	XMLHttpRequest: undefined,
	WebSocket: undefined,
	EventSource: undefined,
	Worker: undefined,
	SharedWorker: undefined,

	// SECURITY: Block storage APIs
	localStorage: undefined,
	sessionStorage: undefined,
	indexedDB: undefined,
	openDatabase: undefined,
}

	// Add global object references to prevent sandbox escape
	sandbox.global = sandbox
	sandbox.self = sandbox
	sandbox.top = sandbox
	sandbox.parent = sandbox
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
		// SECURITY: Prevent prototype pollution
		setPrototypeOf: undefined,
		__proto__: undefined,
	}

	// Create a handler for the vm context
    const excludedProps = [
		'console', 'alert', 'prompt', 'confirm', 
		'document', 'window', 
		'declaredVariables', 'accessedVariables',
		'self', 'top', 'parent',
		// SECURITY: Exclude dangerous APIs from tracking
		'eval', 'Function', 'process', 'global', 'Buffer',
		'__proto__', 'constructor', 'prototype'
	]
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
		warningOutput: getConsoleWarnings(),
		errorOutput: getConsoleErrors(),
		groupOutput: getConsoleGroups(),
		allOutput: [...getConsoleMessages(), ...getAlertMessages()],
		callCounts: getCallCounts(),
		variables: {
			declared: Array.from(context.declaredVariables),
			accessed: Array.from(context.accessedVariables),
		},
		activeIntervalIds: getActiveIntervalIds(),
		activeTimeoutIds: getActiveTimeoutIds()
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
    }
} 