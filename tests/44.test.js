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

    // Check that required function exists with correct parameters
    const printNumsCountExists = hasFunctionWithSignature('printNumsCount', 1)
    checkAndRecord('Function printNumsCount is defined correctly with 1 parameter', printNumsCountExists, 20)

    // Define test cases for printNumsCount
    const printNumsCountTests = [
        { 
            input: [[3, 2, 0, 2, 2, 0, 3]], 
            expected: [2, 0, 3, 2], 
            description: "printNumsCount([3, 2, 0, 2, 2, 0, 3]) returns [2, 0, 3, 2]", 
            points: 10 
        },
        { 
            input: [[0, 1, 2, 3]], 
            expected: [1, 1, 1, 1], 
            description: "printNumsCount([0, 1, 2, 3]) returns [1, 1, 1, 1]", 
            points: 10 
        },
        { 
            input: [[1, 1, 1, 1]], 
            expected: [0, 4, 0, 0], 
            description: "printNumsCount([1, 1, 1, 1]) returns [0, 4, 0, 0]", 
            points: 10 
        },
        { 
            input: [[]], 
            expected: [0, 0, 0, 0], 
            description: "printNumsCount([]) returns [0, 0, 0, 0]", 
            points: 10 
        },
        { 
            input: [[2]], 
            expected: [0, 0, 1, 0], 
            description: "printNumsCount([2]) returns [0, 0, 1, 0]", 
            points: 10 
        },
        { 
            input: [[0, 0, 0]], 
            expected: [3, 0, 0, 0], 
            description: "printNumsCount([0, 0, 0]) returns [3, 0, 0, 0]", 
            points: 10 
        },
        { 
            input: [[3, 3, 3, 3, 3]], 
            expected: [0, 0, 0, 5], 
            description: "printNumsCount([3, 3, 3, 3, 3]) returns [0, 0, 0, 5]", 
            points: 10 
        },
        { 
            input: [[0, 2, 3, 1, 2, 0, 1, 3, 2]], 
            expected: [2, 2, 3, 2], 
            description: "printNumsCount([0, 2, 3, 1, 2, 0, 1, 3, 2]) returns [2, 2, 3, 2]", 
            points: 10 
        }
    ]

    // Run all printNumsCount tests
    printNumsCountTests.forEach(testCase => {
        const testResult = printNumsCountExists 
            ? runFunction('printNumsCount', testCase.input)
            : { success: false, returnValue: null }
        
        checkAndRecord(testCase.description, () => {
            if (!printNumsCountExists || !testResult.success) return false
            
            const result = testResult.returnValue
            
            // Check if result is an array
            if (!Array.isArray(result)) return false
            
            // Check array length (should be 4 for numbers 0-3)
            if (result.length !== 4) return false
            
            // Check array values match expected
            return result.every((val, idx) => val === testCase.expected[idx])
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