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

    // Check that getFactorial function exists with 1 parameter
    const functionExists = hasFunctionWithSignature('getFactorial', 1)
    checkAndRecord('Function getFactorial is defined correctly with 1 parameter', () => {
        return functionExists
    }, 20)

    // Define test cases - each with input, expected output and description
    const testCases = [
        { input: [0], expected: 1, description: 'Function correctly calculates 0! = 1', points: 10 },
        { input: [1], expected: 1, description: 'Function correctly calculates 1! = 1', points: 10 },
        { input: [4], expected: 24, description: 'Function correctly calculates 4! = 24', points: 10 },
        { input: [6], expected: 720, description: 'Function correctly calculates 6! = 720', points: 10 },
        { input: [10], expected: 3628800, description: 'Function correctly calculates 10! = 3628800', points: 10 }
    ]

    // Run all test cases with a generic runner
    testCases.forEach(testCase => {
        // If function exists, run the actual test, otherwise return false
        const testResult = functionExists 
            ? runFunction('getFactorial', testCase.input)
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