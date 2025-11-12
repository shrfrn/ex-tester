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
	getActiveTimeoutIds,
} from './mock-browser.service.js'

let context = null

export function getContext() {
	return context
}

export function runInContext(code, inputs = [], timeout = 500) {
	const sandbox = initSandbox()
	const script = new vm.Script(code)

	context = vm.createContext(sandbox)

	_setupInputSimulation(inputs)

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

export function initSandbox() {
	resetMocks()

	const sandbox = {
		..._getDefaultContext(),
		..._createConsoleMocks(),
		..._createBrowserMocks(),
		..._createSecurityRestrictions(),

		declaredVariables: new Set(),
		accessedVariables: new Set(),
	}

	_setupSandboxReferences(sandbox)
	_preventPrototypePollution(sandbox)

	return new Proxy(sandbox, _createProxyHandler())
}

export function getSideEffects() {
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
		activeTimeoutIds: getActiveTimeoutIds(),
	}
}

function _setupInputSimulation(inputs) {
	// Pre-load responses for prompt() and confirm() calls
	// This simulates user input so tests can run without human interaction
	// 
	// How it works:
	// 1. Tests pass an array like: ['John', 25, true, 'Yes']
	// 2. We separate by type: confirm() expects booleans, prompt() expects strings/numbers
	// 3. Each call to prompt() will shift and return the next non-boolean value
	// 4. Each call to confirm() will shift and return the next boolean value
	//
	// Example student code:
	//   let name = prompt('Enter name')     // Returns 'John'
	//   let age = prompt('Enter age')       // Returns 25
	//   let isAdult = confirm('Are you 18+?')  // Returns true
	//   let city = prompt('Enter city')     // Returns 'Yes'
    
	const confirmInputs = inputs.filter(input => typeof input === 'boolean')
	const promptInputs = inputs.filter(input => typeof input !== 'boolean')

	if (confirmInputs.length > 0) setConfirmResponses(confirmInputs)
	if (promptInputs.length > 0) setPromptResponses(promptInputs)
}

function _createConsoleMocks() {
	return {
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
			timeLog: mockConsoleTimeLog,
		},
	}
}

function _createBrowserMocks() {
	return {
		alert: mockAlert,
		prompt: mockPrompt,
		confirm: mockConfirm,
		setInterval: mockSetInterval,
		clearInterval: mockClearInterval,
		setTimeout: mockSetTimeout,
		clearTimeout: mockClearTimeout,
	}
}

function _createSecurityRestrictions() {
	return {
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
	}
}

function _setupSandboxReferences(sandbox) {
	// Add global object references to prevent sandbox escape

	sandbox.global = sandbox
	sandbox.self = sandbox
	sandbox.top = sandbox
	sandbox.parent = sandbox
}

function _preventPrototypePollution(sandbox) {
	// Block dangerous Object methods that could be used for prototype pollution attacks
	sandbox.Object = {
		...Object,
		// SECURITY: Prevent prototype pollution
		setPrototypeOf: undefined,
		__proto__: undefined,
	}
}

function _createProxyHandler() {
	// Properties to exclude from variable tracking
	// These are built-in APIs, internal properties, and dangerous APIs
	// that shouldn't be tracked as student-declared variables

	const excludedProps = [
		'console', 'alert', 'prompt', 'confirm',      // Built-in I/O functions
		'declaredVariables', 'accessedVariables',     // Internal tracking sets
		'self', 'top', 'parent', 'global',            // Sandbox escape prevention
        
		// SECURITY: Exclude dangerous APIs from tracking
		'eval', 'Function', 'process', 'Buffer',
		'__proto__', 'constructor', 'prototype',
	]

	return {
		// Intercept property reads to track which variables students ACCESS
		// Example: When student code reads 'userName', we track it
        
		get: (target, prop) => {
			// Only track string properties (excludes Symbols used internally by JavaScript)
			// and exclude built-in APIs from tracking

			if (typeof prop === 'string' && !excludedProps.includes(prop)) {
				target.accessedVariables.add(prop)
			}
			
			// IMPORTANT: Throw ReferenceError for undeclared variables to support strict mode
			// Without this, strict mode doesn't work properly (a -= 9 won't throw error)
			if (!(prop in target)) {
				throw new ReferenceError(`${prop} is not defined`)
			}
			
			return target[prop]
		},
		
		// Intercept property writes to track which variables students DECLARE
		// Example: When student code writes 'let x = 5', we track 'x'

		set: (target, prop, value) => {
			// Only track string properties (excludes Symbols)
			// Note: We track ALL declarations, even if they shadow built-ins

			if (typeof prop === 'string') {
				target.declaredVariables.add(prop)
			}
			target[prop] = value
			return true
		},
	}
}

function _getDefaultContext() {
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
		// Error constructors needed for proper error handling and stack traces
		Error,
		TypeError,
		ReferenceError,
		SyntaxError,
		RangeError,
		URIError,
		EvalError,
	}
}