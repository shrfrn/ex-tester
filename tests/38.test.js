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
        return loopRegex.test(studentCode)
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
        weight: 1, 
        studentCode 
    }
} 