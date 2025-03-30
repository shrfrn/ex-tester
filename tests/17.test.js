import { runScript, runFunction, hasFunctionWithSignature, checkReturnValueType } from '../src/testUtils.js'
import { createTestCollector } from '../src/testCollector.js'
import { stripComments } from '../src/fileUtils.js'

export function test(studentFilePath) {
    let studentCode = stripComments(studentFilePath)
    if (!studentCode) return { submitted: false }

    let { checkAndRecord, getResults } = createTestCollector()

    // Test that the script runs without errors
    const result = runScript(studentCode)
    checkAndRecord('Code executes successfully', result.success, 10)

    // Check that getBigger function exists with 2 parameters
    const functionExists = hasFunctionWithSignature('getBigger', 2)
    checkAndRecord('Function getBigger is defined correctly with 2 parameters', () => {
        return functionExists
    }, 20)

    // Define test cases - each with input, expected output and description
    const testCases = [
        { input: [10, 4], expected: 10, description: 'Function correctly identifies when first number is larger', points: 10 },
        { input: [4, 10], expected: 10, description: 'Function correctly identifies when second number is larger', points: 10 },
        { input: [-7, 0], expected: 0, description: 'Function correctly compares negative and positive numbers', points: 10 },
        { input: [-7, -3], expected: -3, description: 'Function correctly compares two negative numbers', points: 10 },
        { input: [5, 5], expected: 5, description: 'Function correctly handles equal numbers', points: 10 },
        { input: [0, 100], expected: 100, description: 'Function correctly handles zero values', points: 10 }
    ]

    // Run all test cases with a generic runner
    testCases.forEach(testCase => {
        // If function exists, run the actual test, otherwise return false
        const testResult = functionExists 
            ? runFunction('getBigger', testCase.input)
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
        weight: 1, 
        studentCode 
    }
} 