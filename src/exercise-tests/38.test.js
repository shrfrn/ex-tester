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

    // Check that biggerThan100 function exists with 1 parameter
    const functionExists = hasFunctionWithSignature('biggerThan100', 1)
    checkAndRecord('Function biggerThan100 is defined correctly with 1 parameter', () => {
        return functionExists
    }, 20)

    // Define test cases
    const testCases = [
        { 
            input: [[50, 120, 80, 200, 90]], 
            expected: [120, 200],
            description: 'Example from exercise'
        },
        { 
            input: [[10, 20, 30, 40, 50]], 
            expected: [],
            description: 'No numbers greater than 100'
        },
        { 
            input: [[100, 101, 99, 150, 200]], 
            expected: [101, 150, 200],
            description: 'Edge case with 100 and numbers close to 100'
        },
        { 
            input: [[1000, 500, 250, 150, 105]], 
            expected: [1000, 500, 250, 150, 105],
            description: 'All numbers greater than 100'
        },
        {
            input: [[]], 
            expected: [],
            description: 'Empty array'
        }
    ]

    // Check for loop usage using regex
    checkAndRecord('Uses a loop to filter the array', () => {
        const loopRegex = /for\s*\(.*\)|while\s*\(.*\)/
        return loopRegex.test(strippedCode)
    }, 15)

    // Run all test cases
    testCases.forEach(testCase => {
        // If function exists, run the actual test, otherwise return false
        const testResult = functionExists 
            ? runFunction('biggerThan100', testCase.input)
            : { success: false, returnValue: null, allOutput: [] }
        
        // Check that the function returns the expected result
        checkAndRecord(`Returns correct filtered array for "${testCase.description}"`, () => {
            if (!functionExists || !testResult.success) return false
            
            const expected = JSON.stringify(testCase.expected)
            const actual = JSON.stringify(testResult.returnValue)
            
            return expected === actual
        }, 10)
    })
    
    return { 
        ...getResults(), 
        success: result.success, 
        error: result.error, 
        
        studentCode: originalCode
    }
} 