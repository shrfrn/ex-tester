export function validateVarNames(codeString) {
    
	const variableDeclarations = [
		// const UPPER_SNAKE_CASE = ...
		{ pattern: /const\s+([A-Z][A-Z0-9_]*)\s*=/g, isGlobalConst: true },
		// let/var/const camelCase = ...
		{ pattern: /(let|var|const)\s+([a-zA-Z0-9_]+)\s*=/g, isGlobalConst: false },
		// function camelCase(...) { ... }
		{ pattern: /function\s+([a-zA-Z0-9_]+)/g, isGlobalConst: false },
	]

	const camelCasePattern = /^[a-z][a-zA-Z0-9]*$/
	const upperSnakeCasePattern = /^[A-Z][A-Z0-9_]*$/

	const violations = []

	// Validate variable declarations and function names
	variableDeclarations.forEach(declarationType => {
		let match
		while ((match = declarationType.pattern.exec(codeString)) !== null) {
			const name = match[match.length - 1]
			const isValid = (declarationType.isGlobalConst && upperSnakeCasePattern.test(name)) || camelCasePattern.test(name)

			if (!isValid) {
				violations.push({
					name,
					position: match.index,
					expected: declarationType.isGlobalConst ? 'UPPER_SNAKE_CASE or camelCase' : 'camelCase',
				})
			}
		}
	})

	// Validate function parameters
	const paramViolations = _validateFunctionParameters(codeString, camelCasePattern)
	violations.push(...paramViolations)

	return {
		score: violations.length === 0 ? 0 : -5,
		violations,
	}
}

function _validateFunctionParameters(codeString, camelCasePattern) {
	const violations = []
	const functionParamPattern = /function\s+[a-zA-Z0-9_]+\s*\(([^)]*)\)/g
	
	let funcMatch
	while ((funcMatch = functionParamPattern.exec(codeString)) !== null) {
		const params = funcMatch[1]
		if (!params.trim()) continue
		
		// Calculate line number from match position
		const lineNumber = codeString.substring(0, funcMatch.index).split('\n').length
		
		// Split parameters by comma and validate each
		const paramNames = params.split(',').map(p => p.trim().split(/\s+/)[0])
		paramNames.forEach(paramName => {
			if (paramName && !camelCasePattern.test(paramName)) {
				violations.push({
					name: paramName,
					line: lineNumber,
					position: funcMatch.index,
					expected: 'camelCase',
				})
			}
		})
	}
	
	return violations
}

