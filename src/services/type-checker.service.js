import { getContext } from './sandbox.service.js'

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
	const context = getContext()

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

