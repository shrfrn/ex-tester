import { runScript, runFunction } from '../services/code-runner.service.js'
import { checkReturnValueType, hasFunctionWithSignature } from '../services/type-checker.service.js'
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

    // Check that calculateSum function exists with 2 parameters
    const functionExists = hasFunctionWithSignature('calculateSum', 2)
    checkAndRecord('Function calculateSum is defined correctly with 2 parameters', () => {
        return functionExists
    }, 20)

    // Define test cases - each with input, expected output and description
    const testCases = [
        { input: [5, 3], expected: 8, description: 'Function correctly adds positive numbers', points: 10 },
        { input: [-10, 4], expected: -6, description: 'Function correctly adds a negative and positive number', points: 10 },
        { input: [-7, -3], expected: -10, description: 'Function correctly adds two negative numbers', points: 10 },
        { input: [0, 5], expected: 5, description: 'Function correctly handles zero', points: 10 },
        { input: [2.5, 3.5], expected: 6, description: 'Function correctly adds decimal numbers', points: 10 }
    ]

    // Run all test cases with a generic runner
    testCases.forEach(testCase => {
        // If function exists, run the actual test, otherwise return false
        const testResult = functionExists 
            ? runFunction('calculateSum', testCase.input)
            : { success: false, returnValue: null }
        
        checkAndRecord(testCase.description, () => {
            if (!functionExists || !testResult.success) return false
            
            // Check that returnValue has the expected type before operating on it
            if (!checkReturnValueType(testResult.returnValue, 'number')) return false
            
            return testResult.returnValue === testCase.expected
        }, testCase.points)
    })

    return { 
        ...getResults(), 
        success: result.success, 
        error: result.error, 
        
        studentCode: originalCode
    }
} 