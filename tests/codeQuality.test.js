import { stripComments } from "../src/fileUtils.js"

export function validateCodeQuality(exerciseFile) {
    const codeString = stripComments(exerciseFile)
    if (exerciseFile.includes('Ido')) {
        console.log(codeString)
    }
    const results = [
        validateVarNames(codeString),
        validateIndentation(codeString),
        validateLineSpacing(codeString),
        validateQuotes(codeString),
        validateNoSemicolons(codeString),
    ]

	return {
		score: results.reduce((acc, result) => acc + result.score, 0),
		results,
	}
}

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

export function validateIndentation(codeString) {
	const lines = codeString.split('\n')
	let indentStyle = null // 'space' or 'tab'
	let indentSize = null // For spaces, how many spaces per level
	const violations = []
	
	// Skip empty lines at the beginning
	let firstNonEmptyLine = 0
	while (firstNonEmptyLine < lines.length && lines[firstNonEmptyLine].trim() === '') {
		firstNonEmptyLine++
	}
	
	// Determine indent style from first indented line
	for (let i = firstNonEmptyLine + 1; i < lines.length; i++) {
		const line = lines[i]
		if (line.trim() === '') continue
		
		const indentMatch = line.match(/^(\s+)/)
		if (indentMatch) {
			const indent = indentMatch[1]
			if (indent.includes('\t')) {
				indentStyle = 'tab'
				indentSize = 1
			} else {
				indentStyle = 'space'
				indentSize = indent.length
				// Try to determine if this is a full indent level
				const nextIndentedLine = lines.slice(i + 1).find(l => l.trim() !== '' && l.match(/^\s+/))
				if (nextIndentedLine) {
					const nextIndent = nextIndentedLine.match(/^(\s+)/)[1]
					if (nextIndent.length > indent.length && nextIndent.length % indent.length === 0) {
						indentSize = indent.length
					}
				}
			}
			break
		}
	}
	
	// If we couldn't determine an indent style, the file might be too simple
	if (!indentStyle) {
		return {
			score: 0,
			violations,
		}
	}
	
	// Track the expected indent level based on code blocks
	let expectedIndentLevel = 0
	let bracketStack = []
	
	for (let i = 0; i < lines.length; i++) {
		const line = lines[i].trimRight() // Remove trailing whitespace
		if (line.trim() === '') continue // Skip empty lines
		
		// Get the current line's indent
		const indentMatch = line.match(/^(\s+)/)
		const currentIndent = indentMatch ? indentMatch[1] : ''
		
		// Check if this line decreases the indent level (closing brackets)
		const startsWithClosing = /^[\s]*[}\])]/.test(line)
		if (startsWithClosing) {
			expectedIndentLevel = Math.max(0, expectedIndentLevel - 1)
		}
		
		// Check if the indentation is consistent with the style
		if (indentStyle === 'tab' && currentIndent.includes(' ')) {
			violations.push({
				line: i + 1,
				content: line,
				message: "Line uses spaces but file uses tabs for indentation"
			})
		} else if (indentStyle === 'space' && currentIndent.includes('\t')) {
			violations.push({
				line: i + 1,
				content: line,
				message: "Line uses tabs but file uses spaces for indentation"
			})
		}
		
		// Check indentation level
		const expectedIndentString = indentStyle === 'tab' 
			? '\t'.repeat(expectedIndentLevel)
			: ' '.repeat(expectedIndentLevel * indentSize)
		
		if (currentIndent !== expectedIndentString) {
			violations.push({
				line: i + 1,
				content: line,
				message: `Incorrect indentation level. Expected ${expectedIndentLevel} levels (${expectedIndentString.length} ${indentStyle}s)`
			})
		}
		
		// Count brackets to track code blocks
		// Note: this is a simplified approach and doesn't handle all edge cases
		const openingCount = (line.match(/[{[(]/g) || []).length
		const closingCount = (line.match(/[}\])]/g) || []).length
		
		// If line ends with an opening bracket, increase expected indent for next line
		if (/[{[(]\s*$/.test(line)) {
			expectedIndentLevel++
		}
		
		// Track overall bracket balance
		for (const char of line) {
			if ('{[('.includes(char)) {
				bracketStack.push(char)
			} else if (char === '}' && bracketStack[bracketStack.length - 1] === '{') {
				bracketStack.pop()
			} else if (char === ']' && bracketStack[bracketStack.length - 1] === '[') {
				bracketStack.pop()
			} else if (char === ')' && bracketStack[bracketStack.length - 1] === '(') {
				bracketStack.pop()
			}
		}
	}
	
	return {
		score: violations.length === 0 ? 0 : -5,
		indentStyle,
		indentSize,
		violations
	}
}

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
			if (consecutiveCount === 0) {
				startLine = i
			}
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

export function validateNoSemicolons(codeString) {
	const lines = codeString.split('\n')
	const violations = []
	
	// This regex will find lines ending with a semicolon
	// It ignores semicolons inside comments or strings
	// We need to process the code line by line
	for (let i = 0; i < lines.length; i++) {
		const line = lines[i].trim()
		if (line === '') continue
		
		// Skip lines that are part of multi-line comments
		if (line.startsWith('/*') || line.startsWith('*') || line.endsWith('*/')) continue
		
		// Skip single-line comments
		if (line.startsWith('//')) continue
		
		// Skip for loop declarations which legitimately use semicolons
		if (line.startsWith('for ') && line.includes(';')) continue
		
		// Check if the line ends with a semicolon
		// We need to be careful about semicolons inside strings
		let inSingleQuoteString = false
		let inDoubleQuoteString = false
		let inTemplateString = false
		let effectiveLine = ''
		
		for (let j = 0; j < line.length; j++) {
			const char = line[j]
			const prevChar = j > 0 ? line[j - 1] : ''
			
			// Handle string context
			if (char === "'" && prevChar !== '\\' && !inDoubleQuoteString && !inTemplateString) {
				inSingleQuoteString = !inSingleQuoteString
			} else if (char === '"' && prevChar !== '\\' && !inSingleQuoteString && !inTemplateString) {
				inDoubleQuoteString = !inDoubleQuoteString
			} else if (char === '`' && prevChar !== '\\' && !inSingleQuoteString && !inDoubleQuoteString) {
				inTemplateString = !inTemplateString
			}
			
			// Append character if not in a string
			if (!inSingleQuoteString && !inDoubleQuoteString && !inTemplateString) {
				effectiveLine += char
			}
		}
		
		// Remove inline comments
		effectiveLine = effectiveLine.replace(/\/\/.*$/, '')
		
		// Now check if the effective line ends with a semicolon
		if (effectiveLine.trimRight().endsWith(';')) {
			violations.push({
				line: i + 1,
				content: line,
				message: 'Line should not end with a semicolon'
			})
		}
	}
	
	return {
		score: violations.length === 0 ? 0 : -2,
		violations
	}
}