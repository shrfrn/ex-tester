// Validation Strategy: Sequential 3-phase approach
// 1. Detect indentation norm from first indented line (tabs vs spaces, size)
// 2. Calculate expected indent level for each line based on bracket nesting
// 3. Validate every line matches the norm at the correct depth
// Result: First violation = fail, all consistent = perfect

export function validateIndentation(codeString) {
	const lines = codeString.split('\n')

	// Phase 1: Establish the indentation norm from first indented line
	const styleInfo = _detectIndentStyle(lines)
	
	if (!styleInfo) {
		return { score: 0, violations: [] }
	}

	const { indentStyle, indentSize } = styleInfo
	
	// Phase 2: Calculate what indent level each line should be at
	const expectedLevels = _calculateExpectedIndentLevels(lines)
	
	// Phase 3: Validate every line matches norm at correct depth
	const violations = _validateIndentConsistency(lines, indentStyle, indentSize, expectedLevels)
	
	return {
		score: violations.length === 0 ? 0 : -5,
		indentStyle,
		indentSize,
		violations
	}
}

// Phase 1: Detect indentation style and size from first indented line
// Returns: { indentStyle: 'tab'|'space', indentSize: number } or null if mixed/none
// Strategy: First indented line establishes the norm - no look-ahead needed

function _detectIndentStyle(lines) {
	// Skip leading empty lines
	let firstNonEmptyLine = 0
	
	while (firstNonEmptyLine < lines.length && lines[firstNonEmptyLine].trim() === '') {
		firstNonEmptyLine++
	}
	
	// Find first indented line and use it to establish norm
	for (let i = firstNonEmptyLine + 1; i < lines.length; i++) {
		const line = lines[i]
		
		if (line.trim() === '') continue
		
		const indentMatch = line.match(/^(\s+)/)
		if (!indentMatch) continue
		
		const indent = indentMatch[1]
		
		// Reject mixed tabs and spaces on same line
		if (indent.includes('\t') && indent.includes(' ')) {
			return null
		}
		
		// Tabs detected - establish tab style (1 tab per level)
		if (indent.includes('\t')) {
			return { indentStyle: 'tab', indentSize: 1 }
		}
		
		// Spaces detected - first indent length becomes the norm
		return { indentStyle: 'space', indentSize: indent.length }
	}
	
	return null
}

// Phase 2: Calculate expected indent level for each line based on bracket nesting
// Returns: Array of expected levels (0, 1, 2, etc.) - one per line, null for empty lines
// Strategy: Track opening/closing brackets to determine nesting depth

function _calculateExpectedIndentLevels(lines) {
	const expectedLevels = []
	let currentLevel = 0
	
	for (let i = 0; i < lines.length; i++) {
		const line = lines[i].trimRight()
		
		if (line.trim() === '') {
			expectedLevels.push(null)
			continue
		}
		
		// Closing brackets decrease level BEFORE the line (closing bracket at outer level)
		const startsWithClosing = /^[\s]*[}\])]/.test(line)
		
		if (startsWithClosing) {
			currentLevel = Math.max(0, currentLevel - 1)
		}
		
		expectedLevels.push(currentLevel)
		
		// Opening brackets increase level AFTER the line (next line goes deeper)
		if (/[{[(]\s*$/.test(line)) {
			currentLevel++
		}
	}
	
	return expectedLevels
}

// Phase 3: Validate every line matches the established norm at correct depth
// Returns: Array of violations (empty = perfect indentation)
// Strategy: Check each line for style consistency and correct depth

function _validateIndentConsistency(lines, indentStyle, indentSize, expectedLevels) {
	const violations = []
	
	for (let i = 0; i < lines.length; i++) {
		const line = lines[i].trimRight()
		
		if (line.trim() === '') continue
		
		const indentMatch = line.match(/^(\s+)/)
		const currentIndent = indentMatch ? indentMatch[1] : ''
		const expectedLevel = expectedLevels[i]
		
		// Check 1: Mixed tabs and spaces on same line (always wrong)
		if (currentIndent.includes('\t') && currentIndent.includes(' ')) {
			violations.push({
				line: i + 1,
				content: line,
				message: 'Line mixes tabs and spaces for indentation'
			})
			continue
		}
		
		// Check 2: Style consistency (tabs vs spaces throughout file)
		if (indentStyle === 'tab' && currentIndent.includes(' ')) {
			violations.push({
				line: i + 1,
				content: line,
				message: 'Line uses spaces but file uses tabs for indentation'
			})
		} else if (indentStyle === 'space' && currentIndent.includes('\t')) {
			violations.push({
				line: i + 1,
				content: line,
				message: 'Line uses tabs but file uses spaces for indentation'
			})
		}
		
		// Check 3: Correct indent depth (right number of tabs/spaces for nesting level)
		if (expectedLevel !== null) {
			const expectedIndentString = indentStyle === 'tab' 
				? '\t'.repeat(expectedLevel)
				: ' '.repeat(expectedLevel * indentSize)
			
			if (currentIndent !== expectedIndentString) {
				violations.push({
					line: i + 1,
					content: line,
					message: `Incorrect indentation level. Expected ${expectedLevel} levels (${expectedIndentString.length} ${indentStyle}s)`
				})
			}
		}
	}
	
	return violations
}
