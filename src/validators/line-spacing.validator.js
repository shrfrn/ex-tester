export function validateLineSpacing(codeString) {
	const lines = codeString.split('\n')
	const MAX_CONSECUTIVE_LINES = 4
	const violations = []
	
	let consecutiveCount = 0
	let startLine = 0
	
	for (let i = 0; i < lines.length; i++) {
		const line = lines[i].trim()
		
		if (line === '') {
			// Found an empty line, check if previous block had too many consecutive lines
			if (consecutiveCount > MAX_CONSECUTIVE_LINES) {
				violations.push({
					startLine: startLine + 1, // 1-indexed line numbers
					endLine: i,
					count: consecutiveCount,
					message: `Found ${consecutiveCount} consecutive non-empty lines without spacing (maximum is ${MAX_CONSECUTIVE_LINES})`
				})
			}
			consecutiveCount = 0
		} else {
			// Non-empty line
			if (consecutiveCount === 0) startLine = i
			consecutiveCount++
		}
	}
	
	// Check at the end of the file
	if (consecutiveCount > MAX_CONSECUTIVE_LINES) {
		violations.push({
			startLine: startLine + 1, // 1-indexed line numbers
			endLine: lines.length,
			count: consecutiveCount,
			message: `Found ${consecutiveCount} consecutive non-empty lines without spacing (maximum is ${MAX_CONSECUTIVE_LINES})`
		})
	}
	
	return {
		score: violations.length === 0 ? 0 : -2,
		violations,
		maxConsecutiveAllowed: MAX_CONSECUTIVE_LINES
	}
}

