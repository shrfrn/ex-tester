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

    // Check that required functions exist with correct parameters
    const sumArraysExists = hasFunctionWithSignature('sumArrays', 2)
    const getArrayFromUserExists = hasFunctionWithSignature('getArrayFromUser', 0)
    
    checkAndRecord('Function sumArrays is defined correctly with 2 parameters', () => {
        return sumArraysExists
    }, 10)
    
    checkAndRecord('Helper function getArrayFromUser is defined', () => {
        return getArrayFromUserExists
    }, 10)

    // Define test cases for sumArrays function
    const testCases = [
        { 
            input: [[1, 4, 3], [2, 5, 1, 9]], 
            expected: [3, 9, 4, 9],
            description: 'Example from exercise with different length arrays'
        },
        { 
            input: [[10, 20, 30], [5, 10, 15]], 
            expected: [15, 30, 45],
            description: 'Arrays of equal length with positive numbers'
        },
        { 
            input: [[1, 2, 3], []], 
            expected: [1, 2, 3],
            description: 'Second array is empty'
        },
        { 
            input: [[], [4, 5, 6]], 
            expected: [4, 5, 6],
            description: 'First array is empty'
        },
        {
            input: [[], []], 
            expected: [],
            description: 'Both arrays are empty'
        },
        {
            input: [[-1, -2, -3], [1, 2, 3]], 
            expected: [0, 0, 0],
            description: 'Arrays with negative numbers'
        },
        {
            input: [[100], [1, 2, 3, 4, 5]], 
            expected: [101, 2, 3, 4, 5],
            description: 'Very different length arrays'
        }
    ]

    // Run all test cases for sumArrays
    testCases.forEach(testCase => {
        const testResult = sumArraysExists 
            ? runFunction('sumArrays', testCase.input) 
            : { success: false, returnValue: null }
        
        checkAndRecord(`sumArrays handles "${testCase.description}" correctly`, () => {
            if (!sumArraysExists || !testResult.success) return false
            
            // Check that returnValue has the expected type before operating on it
            if (!checkReturnValueType(testResult.returnValue, 'array')) return false
            
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