// Exercise text does not specify defining a function called bubble sort 
// this makes it very difficult to test the exercise correctly. 
// Consider altering the exercise text

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
    
    // Check that required functions exist with correct parameters
    const sortNumsExists = hasFunctionWithSignature('sortNums', 1)
    const bubbleSortExists = hasFunctionWithSignature('bubbleSort', 1)
    
    checkAndRecord('Function sortNums is defined correctly with 1 parameter', sortNumsExists, 10)
    checkAndRecord('Function bubbleSort is defined correctly with 1 parameter', bubbleSortExists, 10)
    
    // Define test cases for both sorting functions
    const testCases = [
        { 
            input: [64, 34, 25, 12, 22, 11, 90],
            expected: [11, 12, 22, 25, 34, 64, 90],
            description: 'Example from exercise: [64, 34, 25, 12, 22, 11, 90]'
        },
        { 
            input: [1, 2, 3, 4, 5],
            expected: [1, 2, 3, 4, 5],
            description: 'Already sorted array: [1, 2, 3, 4, 5]'
        },
        { 
            input: [5, 4, 3, 2, 1],
            expected: [1, 2, 3, 4, 5],
            description: 'Reverse sorted array: [5, 4, 3, 2, 1]'
        },
        { 
            input: [1],
            expected: [1],
            description: 'Single element array: [1]'
        },
        { 
            input: [],
            expected: [],
            description: 'Empty array: []'
        },
        { 
            input: [3, 1, 4, 1, 5, 9, 2, 6, 5, 3, 5],
            expected: [1, 1, 2, 3, 3, 4, 5, 5, 5, 6, 9],
            description: 'Array with duplicates: [3, 1, 4, 1, 5, 9, 2, 6, 5, 3, 5]'
        },
        { 
            input: [-5, 3, -2, 0, 1],
            expected: [-5, -2, 0, 1, 3],
            description: 'Array with negative numbers: [-5, 3, -2, 0, 1]'
        }
    ]
    
    // Test sortNums function
    testCases.forEach((testCase, index) => {
        checkAndRecord(`Test ${index + 1}: sortNums with ${testCase.description}`, () => {
            if (!sortNumsExists) return false
            
            const testResult = runFunction('sortNums', [testCase.input])
            
            if (!testResult.success) return false
            
            // Check if result is an array
            if (!Array.isArray(testResult.returnValue)) return false
            
            // Check if result matches expected array using Array.every
            return testResult.returnValue.every((val, idx) => val === testCase.expected[idx])
        }, 10)
    })
    
    // Test bubbleSort function
    testCases.forEach((testCase, index) => {
        checkAndRecord(`Test ${index + 1}: bubbleSort with ${testCase.description}`, () => {
            if (!bubbleSortExists) return false
            
            const testResult = runFunction('bubbleSort', [testCase.input])
            
            if (!testResult.success) return false
            
            // Check if result is an array
            if (!Array.isArray(testResult.returnValue)) return false
            
            // Check if result matches expected array using Array.every
            return testResult.returnValue.every((val, idx) => val === testCase.expected[idx])
        }, 10)
    })
    
    // Test that both functions handle the same input consistently
    checkAndRecord('Both sorting functions produce identical results for the same input', () => {
        if (!sortNumsExists || !bubbleSortExists) return false
        
        const testArray = [64, 34, 25, 12, 22, 11, 90]
        
        const sortNumsResult = runFunction('sortNums', [testArray])
        const bubbleSortResult = runFunction('bubbleSort', [testArray])
        
        if (!sortNumsResult.success || !bubbleSortResult.success) return false
        
        // Compare results using Array.every
        return sortNumsResult.returnValue.every((val, idx) => val === bubbleSortResult.returnValue[idx])
    }, 10)
    
    return { 
        ...getResults(), 
        success: result.success, 
        error: result.error, 
        weight: 1, 
        studentCode 
    }
} 