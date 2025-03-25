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

    // Check for matrix definition
    checkAndRecord('Creates a matrix with numbers', () => {
        // Access the context object containing all global variables and functions
        const context = result.context || {}
        
        // Check each property in the context to find a matrix
        return Object.values(context).some(variable => {
            // Check if it's an array
            if (!Array.isArray(variable)) return false
            
            // Check if it has at least one element 
            if (variable.length === 0) return false
            
            // Check if all elements are arrays (making it a 2D array)
            return variable.every(row => Array.isArray(row) && row.length > 0)
        })
    }, 10)

    // Check that required functions exist with correct parameters
    const sumColExists = hasFunctionWithSignature('sumCol', 2)
    const sumRowExists = hasFunctionWithSignature('sumRow', 2)
    const findMaxExists = hasFunctionWithSignature('findMax', 2)
    const findAvgExists = hasFunctionWithSignature('findAvg', 1)
    const sumAreaExists = hasFunctionWithSignature('sumArea', 5)
    
    // Check function definitions
    checkAndRecord('Function sumCol is defined correctly', sumColExists, 10)
    checkAndRecord('Function sumRow is defined correctly', sumRowExists, 10)
    checkAndRecord('Function findMax is defined correctly', findMaxExists, 10)
    checkAndRecord('Function findAvg is defined correctly', findAvgExists, 10)
    checkAndRecord('Function sumArea is defined correctly', sumAreaExists, 10)
    
    // Create test matrix
    const testMatrix = [
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 9]
    ]
    
    // Test larger matrix with varied values
    const largeMatrix = [
        [15, 22, 9, 41],
        [8, 17, 23, 5],
        [31, 12, 19, 28],
        [6, 27, 14, 33]
    ]
    
    // Test matrix with negative numbers
    const negativeMatrix = [
        [-5, 10, -15],
        [20, -25, 30],
        [-35, 40, -45]
    ]
    
    // Test sumCol function
    checkAndRecord('sumCol correctly sums values in a column', () => {
        if (!sumColExists) return false
        
        // Test cases for sumCol function
        const testCases = [
            { matrix: testMatrix, colIdx: 1, expected: 15 }, // Example from exercise: 2 + 5 + 8 = 15
            { matrix: testMatrix, colIdx: 0, expected: 12 }, // First column: 1 + 4 + 7 = 12
            { matrix: testMatrix, colIdx: 2, expected: 18 }, // Last column: 3 + 6 + 9 = 18
            { matrix: largeMatrix, colIdx: 3, expected: 107 }, // Last column of large matrix
            { matrix: negativeMatrix, colIdx: 0, expected: -20 } // Column with negative numbers
        ]
        
        // Run each test case
        return testCases.every(testCase => {
            const sumColResult = runFunction('sumCol', [testCase.matrix, testCase.colIdx])
            return sumColResult.success && sumColResult.returnValue === testCase.expected
        })
    }, 10)
    
    // Test sumRow function
    checkAndRecord('sumRow correctly sums values in a row', () => {
        if (!sumRowExists) return false
        
        // Test cases for sumRow function
        const testCases = [
            { matrix: testMatrix, rowIdx: 1, expected: 15 }, // Example from exercise: 4 + 5 + 6 = 15
            { matrix: testMatrix, rowIdx: 0, expected: 6 }, // First row: 1 + 2 + 3 = 6
            { matrix: testMatrix, rowIdx: 2, expected: 24 }, // Last row: 7 + 8 + 9 = 24
            { matrix: largeMatrix, rowIdx: 2, expected: 90 }, // Third row of large matrix
            { matrix: negativeMatrix, rowIdx: 1, expected: 25 } // Row with positive and negative numbers
        ]
        
        // Run each test case
        return testCases.every(testCase => {
            const sumRowResult = runFunction('sumRow', [testCase.matrix, testCase.rowIdx])
            return sumRowResult.success && sumRowResult.returnValue === testCase.expected
        })
    }, 10)
    
    // Test findMax function
    checkAndRecord('findMax correctly finds maximum value in a column', () => {
        if (!findMaxExists) return false
        
        // Test cases for findMax function
        const testCases = [
            { matrix: testMatrix, colIdx: 1, expected: 8 }, // Example from exercise: max of [2, 5, 8] is 8
            { matrix: testMatrix, colIdx: 0, expected: 7 }, // First column: max of [1, 4, 7] is 7
            { matrix: testMatrix, colIdx: 2, expected: 9 }, // Last column: max of [3, 6, 9] is 9
            { matrix: largeMatrix, colIdx: 0, expected: 31 }, // First column of large matrix
            { matrix: negativeMatrix, colIdx: 1, expected: 40 } // Column with positive numbers
        ]
        
        // Run each test case
        return testCases.every(testCase => {
            const findMaxResult = runFunction('findMax', [testCase.matrix, testCase.colIdx])
            return findMaxResult.success && findMaxResult.returnValue === testCase.expected
        })
    }, 10)
    
    // Test findAvg function
    checkAndRecord('findAvg correctly calculates average of all values', () => {
        if (!findAvgExists) return false
        
        // Test cases for findAvg function
        const testCases = [
            { matrix: testMatrix, expected: 5 }, // Example from exercise: (1+2+3+4+5+6+7+8+9)/9 = 5
            { matrix: [[1, 1], [1, 1]], expected: 1 }, // Simple matrix with all 1s
            { matrix: largeMatrix, expected: 20 }, // Average of large matrix is 320/16 = 20
            { matrix: negativeMatrix, expected: -2.78 } // Matrix with negative numbers
        ]
        
        // Run each test case
        return testCases.every(testCase => {
            const findAvgResult = runFunction('findAvg', [testCase.matrix])
            // Using approximate comparison for floating point
            return findAvgResult.success && 
                   Math.abs(findAvgResult.returnValue - testCase.expected) < 0.1
        })
    }, 10)
    
    // Test sumArea function
    checkAndRecord('sumArea correctly sums values in specified area', () => {
        if (!sumAreaExists) return false
        
        // Test cases for sumArea function
        const testCases = [
            { 
                matrix: testMatrix, 
                rowIdxStart: 0, rowIdxEnd: 1, colIdxStart: 0, colIdxEnd: 1, 
                expected: 12 // Example from exercise: 1 + 2 + 4 + 5 = 12
            },
            { 
                matrix: testMatrix, 
                rowIdxStart: 1, rowIdxEnd: 2, colIdxStart: 1, colIdxEnd: 2, 
                expected: 28 // Bottom right 2x2: 5 + 6 + 8 + 9 = 28
            },
            { 
                matrix: largeMatrix, 
                rowIdxStart: 0, rowIdxEnd: 1, colIdxStart: 2, colIdxEnd: 3, 
                expected: 78 // Top right 2x2 of large matrix
            },
            { 
                matrix: negativeMatrix, 
                rowIdxStart: 0, rowIdxEnd: 2, colIdxStart: 0, colIdxEnd: 0, 
                expected: -40 // First column of negative matrix
            }
        ]
        
        // Run each test case
        return testCases.every(testCase => {
            const sumAreaResult = runFunction('sumArea', [
                testCase.matrix, 
                testCase.rowIdxStart, testCase.rowIdxEnd, 
                testCase.colIdxStart, testCase.colIdxEnd
            ])
            return sumAreaResult.success && sumAreaResult.returnValue === testCase.expected
        })
    }, 10)
    
    return { 
        ...getResults(), 
        success: result.success, 
        error: result.error, 
        weight: 1, 
        studentCode 
    }
} 