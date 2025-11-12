import { resetMocks } from './mock-browser.service.js'
import { getContext, runInContext, getSideEffects } from './sandbox.service.js'

// Run a student's code in a sandbox environment
export function runScript(code, inputs = []) {
	let results = {}

	try {
		runInContext(code, inputs)
		results.success = true

	} catch (error) {
		results = { ...results, ..._formatExecutionError(error) }

	} finally {
		results = { ...results, context: getContext(), ...getSideEffects() }
		
		return results
	}
}

// Run a student's function in a sandbox environment
export function runFunction(functionName, inputs = []) {
	const context = getContext()
	
	if (!context) throw new Error('Context not initialized')
	if (!context[functionName]) throw new Error(`Function ${functionName} not found`)

	let results = {}
	resetMocks()

	try {
		var returnValue = context[functionName](...inputs)
		results.success = true
		results.returnValue = returnValue

	} catch (error) {
		results = { ...results, ..._formatExecutionError(error) }

	} finally {
		results = { ...results, ...getSideEffects() }
		
		return results
	}
}

function _formatExecutionError(error) {
	const result = { 
		success: false,
		errorType: error.name || 'Error',
		error: error.message || String(error) || 'Unknown error'
	}

	// Enhanced error handling for stack overflow
	if (error instanceof RangeError && error.message && error.message.includes('Maximum call stack size exceeded')) {
		result.errorType = 'STACK_OVERFLOW'
		result.error = 'Stack Overflow Error: Maximum call stack size exceeded. This usually happens when a function calls itself infinitely (infinite recursion). Check if any function is calling itself without a proper stopping condition.'
	}

	// Try to extract line number from stack trace
	if (error.stack) {
		result.stack = error.stack
		
		const lineMatch = error.stack.match(/evalmachine\.<anonymous>:(\d+):(\d+)/)
		if (lineMatch) {
			result.line = parseInt(lineMatch[1])
			result.column = parseInt(lineMatch[2])
		}
	}

	return result
}

