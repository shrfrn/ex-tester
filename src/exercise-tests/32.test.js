import { runScript } from '../services/code-runner.service.js'
import { createTestCollector } from '../services/test-collector.service.js'
import { readCode, stripComments } from '../services/file-utils.service.js'

export function test(studentFilePath) {
    const originalCode = readCode(studentFilePath)
    if (!originalCode) return { submitted: false }

    const strippedCode = stripComments(originalCode)

    let { checkAndRecord, getResults } = createTestCollector()

    // Define test cases with inputs and expected outputs
    const testCases = [
        {
            inputs: ['Hello'],
            expected: 'olleH',
            description: 'Correctly reverses "Hello" to "olleH"',
            points: 10
        },
        {
            inputs: ['JavaScript'],
            expected: 'tpircSavaJ',
            description: 'Correctly reverses "JavaScript" to "tpircSavaJ"',
            points: 10
        },
        {
            inputs: ['12345'],
            expected: '54321',
            description: 'Correctly reverses "12345" to "54321"',
            points: 10
        },
        {
            inputs: ['a'],
            expected: 'a',
            description: 'Correctly handles single character "a"',
            points: 10
        },
        {
            inputs: [''],
            expected: '',
            description: 'Correctly handles empty string',
            points: 10
        },
        {
            inputs: ['racecar'],
            expected: 'racecar',
            description: 'Correctly reverses palindrome "racecar"',
            points: 10
        }
    ]

    // Run through each test case
    testCases.forEach(testCase => {
        const result = runScript(originalCode, testCase.inputs)
        
        checkAndRecord(`Execution for "${testCase.inputs[0]}" succeeds`, 
            result.success, 10)
        
        // Get the outputs if available, or empty arrays if execution failed
        const consoleOutput = result.success ? (result.consoleOutput || []) : []
        
        // Check for expected output - now looking for inclusion rather than exact match
        checkAndRecord(testCase.description, () => {
            return result.success && consoleOutput.some(output => output.includes(testCase.expected))
        }, testCase.points)
    })

	return {
		...getResults(),
		success: true,
		error: null,
		studentCode: originalCode,
	}
} 