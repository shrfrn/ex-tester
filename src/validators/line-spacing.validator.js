// Validation Strategy: All-or-nothing approach
// First line spacing violation fails the entire metric immediately
// Lines with only closing curly braces are treated as empty/spacing lines

export function validateLineSpacing(codeString) {
	const lines = codeString.split('\n')
	const MAX_CONSECUTIVE_LINES = 4
	
	let consecutiveCount = 0
	let startLine = 0
	
	for (let i = 0; i < lines.length; i++) {
		const line = lines[i].trim()
		
		// Check if line is effectively empty (empty or just a closing brace)
		const isEffectivelyEmpty = line === '' || line === '}'
		
		if (isEffectivelyEmpty) {
			// Found spacing, check if previous block had too many consecutive lines
			if (consecutiveCount > MAX_CONSECUTIVE_LINES) {
				// First violation - fail immediately
				return {
					score: -2,
					violations: [{
						startLine: startLine + 1,
						endLine: i,
						message: `Line spacing error: Found ${consecutiveCount} consecutive lines without spacing (maximum is ${MAX_CONSECUTIVE_LINES})`
					}],
					maxConsecutiveAllowed: MAX_CONSECUTIVE_LINES
				}
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
		return {
			score: -2,
			violations: [{
				startLine: startLine + 1,
				endLine: lines.length,
				message: `Line spacing error: Found ${consecutiveCount} consecutive lines without spacing (maximum is ${MAX_CONSECUTIVE_LINES})`
			}],
			maxConsecutiveAllowed: MAX_CONSECUTIVE_LINES
		}
	}
	
	// No violations - perfect
	return {
		score: 0,
		violations: [],
		maxConsecutiveAllowed: MAX_CONSECUTIVE_LINES
	}
}

