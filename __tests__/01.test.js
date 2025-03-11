import fs from 'fs'
import path from 'path'

import { jest } from '@jest/globals'
import { runCode, outputContains } from './testUtils.js'

describe('Exercise 01 - Full Name Greeting', () => {
	let studentCode
	let studentFilePath

	beforeAll(() => {
		studentFilePath = process.env.CURRENT_STUDENT_FILE_PATH || path.join(process.cwd(), '01.js')
		studentCode = fs.readFileSync(studentFilePath, 'utf8')
	})

	beforeEach(() => jest.clearAllMocks())

	test('should prompt for first and last name and display full name greeting', () => {
		// Test with sample name input
		const firstName = 'John'
		const lastName = 'Smith'

		const result = runCode(studentCode, [firstName, lastName])

		// Verify code executed successfully
		expect(result.success).toBe(true)

		// CRITICAL: Verify prompt was actually called at least twice
		expect(result.callCounts.prompt)
            .toBeGreaterThanOrEqual(2, 'prompt() must be called at least twice to get first and last name')

		// Check that the variables were declared and used
		expect(result.variables.declared)
            .toContain('fullName', 'A variable named fullName must be declared')

        expect(result.variables.accessed)
            .toContain('fullName', 'The fullName variable must be used after being declared')

		// Check if alert or console.log was used to display output
		expect(result.callCounts.alert + result.callCounts.consoleLog)
            .toBeGreaterThan(0, 'Output must be displayed using alert() or console.log()')

		// Output should contain both first and last name
		expect(outputContains(result.allOutput, firstName))
            .toBe(true, 'Output must contain the first name')

		expect(outputContains(result.allOutput, lastName))
            .toBe(true, 'Output must contain the last name')

		// Output should contain both names and at least one additional word (greeting)
		const isValidGreeting = result.allOutput.some(output => {
			const containsFirstName = output.includes(firstName)
			const containsLastName = output.includes(lastName)
			const hasAdditionalWord = output.split(/\s+/).length > 2
			return containsFirstName && containsLastName && hasAdditionalWord
		})

		expect(isValidGreeting).toBe(true, 'Output must contain both first and last name with at least one additional word')
	})

	test('should work with different name inputs', () => {
		// Test with different name inputs
		const testCases = [
			['Alice', 'Johnson'],
			['María', 'García'],
			['Alex', 'Smith-Johnson'],
		]

		// Track outputs to verify they change with different inputs
		const allOutputs = new Set()

		for (const [firstName, lastName] of testCases) {
			const result = runCode(studentCode, [firstName, lastName])

			// Verify code executed successfully
			expect(result.success).toBe(true)

			// CRITICAL: Verify prompt was actually called
			expect(result.callCounts.prompt).toBeGreaterThanOrEqual(2)

			// Output should contain both names
			expect(outputContains(result.allOutput, firstName)).toBe(true)
			expect(outputContains(result.allOutput, lastName)).toBe(true)

			// Add output to set for uniqueness checking
			allOutputs.add(JSON.stringify(result.allOutput))
		}

		// Outputs should be different for different inputs
		// This proves the code actually uses the input values
		expect(allOutputs.size)
            .toBe(3, 'Output must change when different names are provided')
	})

	test('should use variables correctly to build the full name', () => {

		// Run the code and verify variable usage
		const result = runCode(studentCode, ['John', 'Doe'])
		expect(result.success).toBe(true)

		// Make sure the full name is constructed correctly
		const fullNameOutput = result.allOutput.some(output => output.includes('John Doe'))
		expect(fullNameOutput)
            .toBe(true, 'Output must include the full name (first + last)')
	})

	test('should properly concatenate firstName and lastName variables', () => {
		// Check if code uses variables to store names
		expect(studentCode).toMatch(/(let|const|var)[\s\S]*?=[\s\S]*?prompt/)
        
		// Check for proper variable declarations
		expect(studentCode).toMatch(/(let|const|var)\s+firstName\s*=/)
		expect(studentCode).toMatch(/(let|const|var)\s+lastName\s*=/)

		// Check that fullName is assigned using concatenation of firstName and lastName
		expect(studentCode).toMatch(/fullName\s*=\s*firstName\s*[\+]\s*lastName/)

		// Run the code with test values
		const result = runCode(studentCode, ['John', 'Doe'])
		expect(result.success).toBe(true)

		// Verify the fullName variable contains only the concatenated names
		const fullNameValue = result.variables.values.fullName
		expect(fullNameValue)
            .toMatch(/^John\s*Doe$/, 'fullName should only contain the first and last name with any amount of whitespace between them')
	})
})