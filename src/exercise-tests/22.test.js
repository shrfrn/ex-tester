import { runScript, runFunction } from '../services/code-runner.service.js'
import { hasFunctionWithSignature } from '../services/type-checker.service.js'
import { createTestCollector } from '../services/test-collector.service.js'
import { readCode, stripComments } from '../services/file-utils.service.js'

export function test(studentFilePath) {
    const originalCode = readCode(studentFilePath)
    if (!originalCode) return { submitted: false }

    const strippedCode = stripComments(originalCode)

    let { checkAndRecord, getResults, executionFailed } = createTestCollector()

    // Test that the script runs without errors
    const result = runScript(originalCode)
    if (!result.success) return executionFailed(result, originalCode)

    // Check that myPow function exists with 2 parameters
    const functionExists = hasFunctionWithSignature('myPow', 2)
    checkAndRecord('Function myPow is defined correctly with 2 parameters', () => {
        return functionExists
    }, 20)

    // Check that Math.pow is not used
    checkAndRecord('Does not use Math.pow', () => {
        return !strippedCode.includes('Math.pow')
    }, 10)
    
    // Check if a while loop is used (not for or do-while)
    checkAndRecord('Uses a while loop to calculate the power', () => {
        const whileLoopPattern = /while\s*\(/
        return whileLoopPattern.test(strippedCode)
    }, 10)

    // Define test cases from the exercise
    const testCases = [
        { base: 2, exponent: 3, expected: 8, description: 'Base 2, exponent 3' },
        { base: 5, exponent: 2, expected: 25, description: 'Base 5, exponent 2' },
        { base: 3, exponent: 4, expected: 81, description: 'Base 3, exponent 4' },
        { base: 10, exponent: 0, expected: 1, description: 'Base 10, exponent 0 (edge case)' },
        { base: 1, exponent: 10, expected: 1, description: 'Base 1, exponent 10 (edge case)' },
        { base: 0, exponent: 5, expected: 0, description: 'Base 0, exponent 5 (edge case)' },
        { base: 4, exponent: 1, expected: 4, description: 'Base 4, exponent 1 (edge case)' }
    ]

    // Run all test cases with a generic runner
    testCases.forEach(testCase => {
        // If function exists, run the actual test, otherwise return false
        const testResult = functionExists 
            ? runFunction('myPow', [testCase.base, testCase.exponent])
            : { success: false, returnValue: null }
        
        checkAndRecord(`Correct calculation for ${testCase.description}`, () => {
            return functionExists && 
                   testResult.success && 
                   testResult.returnValue === testCase.expected
        }, 10)
    })

    return getResults(result.success, originalCode)
} 