import { runScript, runFunction, hasFunctionWithSignature } from '../src/testUtils.js'
import { createTestCollector } from '../src/testCollector.js'
import { stripComments } from '../src/fileUtils.js'

export function test(studentFilePath) {
    let studentCode = stripComments(studentFilePath)
    if (!studentCode) return { submitted: false }

    let { checkAndRecord, getResults } = createTestCollector()

    // Test that the script runs without errors
    const result = runScript(studentCode)
    checkAndRecord('Code executes successfully', result.success, 20)

    // Check that isAbove18 function exists with 2 parameters
    const functionExists = hasFunctionWithSignature('isAbove18', 2)
    checkAndRecord('Function isAbove18 is defined correctly with 2 parameters', () => {
        return functionExists
    }, 20)
    
    // Define test cases - each with input parameters, expected output, description and points
    const testCases = [
        { 
            input: ['David', 20], 
            expected: true, 
            alertPattern: /david/i, 
            description: 'Function correctly identifies an adult and returns true', 
            points: 10 
        },
        { 
            input: ['Sarah', 16], 
            expected: false, 
            alertPattern: /too\s+young/i, 
            description: 'Function correctly identifies a minor and returns false', 
            points: 10 
        },
        { 
            input: ['Alex', 18], 
            expected: false, 
            alertPattern: /too\s+young/i, 
            description: 'Function correctly handles the edge case (age 18)', 
            points: 10 
        },
    ]

    // Run all test cases with a generic runner
    testCases.forEach(testCase => {
        // If function exists, run the actual test, otherwise return false
        const testResult = functionExists 
            ? runFunction('isAbove18', testCase.input)
            : { success: false, returnValue: null, allOutput: [] }
        
        // Check return value
        checkAndRecord(testCase.description, () => {
            return functionExists && 
                   testResult.success && 
                   testResult.returnValue === testCase.expected
        }, testCase.points)
        
        // Check alert message
        checkAndRecord(`Shows correct alert message for ${testCase.input[0]} (age ${testCase.input[1]})`, () => {
            return functionExists &&
                   testResult.success &&
                   testResult.allOutput.some(output => 
                     testCase.alertPattern.test(output))
        }, 5)
    })
    
    // Check if alert is used
    checkAndRecord('Uses alert for output', () => {
        return functionExists && result.callCounts.alert > 0
    }, 10)
    
    return { 
        ...getResults(), 
        success: result.success, 
        error: result.error, 
        weight: 1, 
        studentCode 
    }
} 