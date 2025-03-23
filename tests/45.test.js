import { runScript, runFunction, hasFunctionWithSignature } from '../src/testUtils.js'
import { createTestCollector } from '../src/testCollector.js'
import { stripComments } from '../src/fileUtils.js'

export function test(studentFilePath) {
    let studentCode = stripComments(studentFilePath)
    if (!studentCode) return { submitted: false }

    let { checkAndRecord, getResults } = createTestCollector()

    // Test that the script runs without errors
    const result = runScript(studentCode)
    checkAndRecord('Code executes successfully', result.success, 10)

    // Check that removeDuplicates function exists with 1 parameter
    const functionExists = hasFunctionWithSignature('removeDuplicates', 1)
    checkAndRecord('Function removeDuplicates is defined correctly with 1 parameter', () => {
        return functionExists
    }, 20)

    // Define test cases
    const testCases = [
        { 
            input: [[5, 4, 5, 2, 1, 2, 4]], 
            expected: [5, 4, 2, 1],
            description: 'Example from exercise'
        },
        { 
            input: [[0, 1, 2, 3, 4, 5]], 
            expected: [0, 1, 2, 3, 4, 5],
            description: 'No duplicates'
        },
        { 
            input: [[3, 3, 3, 3, 3]], 
            expected: [3],
            description: 'All same value'
        },
        { 
            input: [[]], 
            expected: [],
            description: 'Empty array'
        },
        {
            input: [[0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5]], 
            expected: [0, 1, 2, 3, 4, 5],
            description: 'All duplicated values'
        }
    ]

    // Run all test cases
    testCases.forEach(testCase => {
        const testResult = functionExists 
            ? runFunction('removeDuplicates', testCase.input) 
            : { success: false, returnValue: null }
        
        checkAndRecord(`removeDuplicates handles "${testCase.description}" correctly`, () => {
            if (!functionExists || !testResult.success) return false
            
            if (!Array.isArray(testResult.returnValue)) return false

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