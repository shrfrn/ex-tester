export function validateNoSemicolons(codeString) {
	const lines = codeString.split('\n')
	const violations = []
	
	let inMultiLineComment = false
	
	for (let i = 0; i < lines.length; i++) {
		const line = lines[i]
		const trimmed = line.trim()
		
		if (trimmed === '') continue
		
		// Track multi-line comment state
		if (trimmed.includes('/*')) inMultiLineComment = true
		if (inMultiLineComment) {
			if (trimmed.includes('*/')) inMultiLineComment = false
			continue
		}
		
		// Skip single-line comments
		if (trimmed.startsWith('//')) continue
		
		// Strip strings and comments from the line
		const cleaned = stripStringsAndComments(line)
		
		// Check if cleaned line ends with semicolon
		if (cleaned.trim().endsWith(';')) {
			violations.push({
				line: i + 1,
				content: trimmed,
				message: 'Line should not end with a semicolon',
			})
		}
	}
	
	return {
		score: violations.length === 0 ? 0 : -2,
		violations,
	}
}

function stripStringsAndComments(line) {
	return line
		.replace(/`(?:\\.|[^`\\])*`/g, '')      // Remove template literals
		.replace(/"(?:\\.|[^"\\])*"/g, '')      // Remove double-quoted strings
		.replace(/'(?:\\.|[^'\\])*'/g, '')      // Remove single-quoted strings
		.replace(/\/\/.*$/g, '')                // Remove single-line comments
}

