import fs from 'fs'
import path from 'path'

import { jest } from '@jest/globals'
import { runCode, outputContains } from './testUtils.js'
import { createTestCollector } from './testCollector.js'

describe('Exercise 01 - Full Name Greeting', () => {
	let studentCode
	let studentFilePath
	let collector

	beforeAll(() => {
		studentFilePath = process.env.CURRENT_STUDENT_FILE_PATH || path.join(process.cwd(), '01.js')
		studentCode = fs.readFileSync(studentFilePath, 'utf8')
		collector = createTestCollector()
	})

	beforeEach(() => jest.clearAllMocks())

	test('should prompt for first and last name and display full name greeting', () => {
		const firstName = 'John'
		const lastName = 'Smith'
		const result = runCode(studentCode, [firstName, lastName])

		collector.checkAndRecord('Code executes successfully', () => {
			expect(result.success).toBe(true)
		})

		collector.checkAndRecord('Prompt called at least twice', () => {
			expect(result.callCounts.prompt).toBeGreaterThanOrEqual(2)
		})

		collector.checkAndRecord('fullName variable declared', () => {
			expect(result.variables.declared).toContain('fullName')
		})

		collector.checkAndRecord('fullName variable accessed', () => {
			expect(result.variables.accessed).toContain('fullName')
		})

		collector.checkAndRecord('Output method used', () => {
			expect(result.callCounts.alert + result.callCounts.consoleLog).toBeGreaterThan(0)
		})

		collector.checkAndRecord('Output contains first name', () => {
			expect(outputContains(result.allOutput, firstName)).toBe(true)
		})

		collector.checkAndRecord('Output contains last name', () => {
			expect(outputContains(result.allOutput, lastName)).toBe(true)
		})

		collector.checkAndRecord('Valid greeting format', () => {
			const isValidGreeting = result.allOutput.some(output => {
				const containsFirstName = output.includes(firstName)
				const containsLastName = output.includes(lastName)
				const hasAdditionalWord = output.split(/\s+/).length > 2
				return containsFirstName && containsLastName && hasAdditionalWord
			})
			expect(isValidGreeting).toBe(true)
		})
	})

	test('should work with different name inputs', () => {
		const testCases = [
			['Alice', 'Johnson'],
			['María', 'García'],
			['Alex', 'Smith-Johnson'],
		]
		const allOutputs = new Set()

		testCases.forEach(([firstName, lastName]) => {
			const result = runCode(studentCode, [firstName, lastName])

			collector.checkAndRecord(`Code executes successfully for ${firstName} ${lastName}`, () => {
				expect(result.success).toBe(true)
			})

			collector.checkAndRecord(`Prompt called twice for ${firstName} ${lastName}`, () => {
				expect(result.callCounts.prompt).toBeGreaterThanOrEqual(2)
			})

			collector.checkAndRecord(`Output contains ${firstName}`, () => {
				expect(outputContains(result.allOutput, firstName)).toBe(true)
			})

			collector.checkAndRecord(`Output contains ${lastName}`, () => {
				expect(outputContains(result.allOutput, lastName)).toBe(true)
			})

			allOutputs.add(JSON.stringify(result.allOutput))
		})

		collector.checkAndRecord('Outputs differ for different inputs', () => {
			expect(allOutputs.size).toBe(3)
		})
	})

	test('should use variables correctly to build the full name', () => {
		const result = runCode(studentCode, ['John', 'Doe'])

		collector.checkAndRecord('Code executes successfully', () => {
			expect(result.success).toBe(true)
		})

		collector.checkAndRecord('Output includes full name', () => {
			const fullNameOutput = result.allOutput.some(output => output.includes('John Doe'))
			expect(fullNameOutput).toBe(true)
		})
	})

	test('should properly concatenate firstName and lastName variables', () => {
		collector.checkAndRecord('Variables store prompt results', () => {
			expect(studentCode).toMatch(/(let|const|var)[\s\S]*?=[\s\S]*?prompt/)
		})

		collector.checkAndRecord('firstName variable declared properly', () => {
			expect(studentCode).toMatch(/(let|const|var)\s+firstName\s*=/)
		})

		collector.checkAndRecord('lastName variable declared properly', () => {
			expect(studentCode).toMatch(/(let|const|var)\s+lastName\s*=/)
		})

		collector.checkAndRecord('fullName concatenation syntax correct', () => {
			expect(studentCode).toMatch(/fullName\s*=\s*firstName\s*[\+]\s*lastName/)
		})

		const result = runCode(studentCode, ['John', 'Doe'])
		
		collector.checkAndRecord('Code executes successfully', () => {
			expect(result.success).toBe(true)
		})

		collector.checkAndRecord('fullName contains correct concatenated value', () => {
			expect(result.variables.values.fullName).toMatch(/^John\s*Doe$/)
		})

		// Print final results after all tests
		collector.printResults()
	})
})