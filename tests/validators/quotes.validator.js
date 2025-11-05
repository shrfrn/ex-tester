export function validateQuotes(codeString) {
	// Regex to find double quoted strings
	// This considers strings with escape characters but ignores double quotes inside single quoted strings
	const doubleQuoteRegex = /"(?:[^"\\]|\\.)*"/g
	
	const violations = []
	let match
	
	// Find all double quote violations
	while ((match = doubleQuoteRegex.exec(codeString)) !== null) {
		const doubleQuotedString = match[0]
		const position = match.index
		
		// Extract line and column information
		const upToMatch = codeString.substring(0, position)
		const lineNumber = upToMatch.split('\n').length
		
		// Get the line content for context
		const lines = codeString.split('\n')
		const lineContent = lines[lineNumber - 1]
		
		violations.push({
			position,
			line: lineNumber,
			content: lineContent,
			doubleQuotedString,
			message: 'Double quotes should be replaced with single quotes'
		})
	}
	
	return {
        score: violations.length === 0 ? 0 : -2,
		violations
	}
}

