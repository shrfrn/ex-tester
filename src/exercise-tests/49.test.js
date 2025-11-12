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

    // Check that getNthLargest function exists with 2 parameters
    const functionExists = hasFunctionWithSignature('getNthLargest', 2)
    checkAndRecord('Function getNthLargest is defined correctly with 2 parameters', () => {
        return functionExists
    }, 15)

    // Define test cases
    const testCases = [
        { 
            input: [[3, 5, 2, 4, 6, 8], 3], 
            expected: 5,
            description: 'Example from exercise (3rd largest)'
        },
        { 
            input: [[1, 2, 3, 4, 5], 1], 
            expected: 5,
            description: 'Example from exercise (largest)'
        },
        { 
            input: [[10, 20, 30, 40], 4], 
            expected: 10,
            description: 'Last position (smallest)'
        },
        { 
            input: [[100, 200, 300], 2], 
            expected: 200,
            description: 'Middle position'
        },
        {
            input: [[5], 1], 
            expected: 5,
            description: 'Single element array'
        }
    ]

    // Run test cases
    testCases.forEach(testCase => {
        const testResult = functionExists 
            ? runFunction('getNthLargest', testCase.input) 
            : { success: false, returnValue: null }
        
        checkAndRecord(`getNthLargest handles "${testCase.description}" correctly`, () => {
            if (!functionExists || !testResult.success) return false
            
            return testResult.returnValue === testCase.expected
        }, 10)
    })

    return { 
        ...getResults(), 
        success: result.success, 
        error: result.error, 
        
        studentCode: originalCode
    }
} 