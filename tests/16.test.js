import { runScript, runFunction, hasFunctionWithSignature, checkReturnValueType } from '../src/testUtils.js'
import { createTestCollector } from '../src/testCollector.js'
import { stripComments } from '../src/fileUtils.js'

export function test(studentFilePath) {
    let studentCode = stripComments(studentFilePath)
    if (!studentCode) return { submitted: false }

    let { checkAndRecord, getResults } = createTestCollector()

    // Test that the script runs without errors
    const result = runScript(studentCode)
    checkAndRecord('Code executes successfully', result.success, 20)

    // Check that isEven function exists with 1 parameter
    const functionExists = hasFunctionWithSignature('isEven', 1)
    checkAndRecord('Function isEven is defined correctly with 1 parameter', () => {
        return functionExists
    }, 20)

    // Define test cases - each with input, expected output and description
    const testCases = [
        { input: [4], expected: true, description: 'Function correctly identifies even positive numbers', points: 10 },
        { input: [7], expected: false, description: 'Function correctly identifies odd positive numbers', points: 10 },
        { input: [0], expected: true, description: 'Function correctly identifies zero as even', points: 10 },
        { input: [-2], expected: true, description: 'Function correctly identifies even negative numbers', points: 10 },
        { input: [-5], expected: false, description: 'Function correctly identifies odd negative numbers', points: 10 },
        { input: [3.5], expected: false, description: 'Function correctly handles decimal numbers', points: 10 }
    ]

    // Run all test cases with a generic runner
    testCases.forEach(testCase => {
        // If function exists, run the actual test, otherwise return false
        const testResult = functionExists 
            ? runFunction('isEven', testCase.input)
            : { success: false, returnValue: null }
        
        checkAndRecord(testCase.description, () => {
            if (!functionExists || !testResult.success) return false
            
            // Check that returnValue has the expected type before operating on it
            if (!checkReturnValueType(testResult.returnValue, 'boolean')) return false
            
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