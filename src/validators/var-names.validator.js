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

	return {
		score: violations.length === 0 ? 0 : -5,
		violations,
	}
}

