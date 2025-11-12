import { runScript, runFunction } from '../services/code-runner.service.js'
import { checkReturnValueType, hasFunctionWithSignature } from '../services/type-checker.service.js'
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

    // Check that myIndexOf function exists with 2 parameters
    const functionExists = hasFunctionWithSignature('myIndexOf', 2)
    checkAndRecord('Function myIndexOf is defined correctly with 2 parameters', () => {
        return functionExists
    }, 20)

    // Define test cases - each with input, expected output and description
    const testCases = [
        { 
            input: ["Hello World", "World"], 
            expected: 6, 
            description: 'Correctly finds "World" in "Hello World" at index 6', 
            points: 10 
        },
        { 
            input: ["Hello World", "xyz"], 
            expected: -1, 
            description: 'Correctly returns -1 when "xyz" not found in "Hello World"', 
            points: 10 
        },
        { 
            input: ["JavaScript", "Script"], 
            expected: 4, 
            description: 'Correctly finds "Script" in "JavaScript" at index 4', 
            points: 10 
        },
        { 
            input: ["programming", "gram"], 
            expected: 3, 
            description: 'Correctly finds "gram" in "programming" at index 3', 
            points: 10 
        },
        { 
            input: ["hello", "hello"], 
            expected: 0, 
            description: 'Correctly handles when search string equals main string', 
            points: 10 
        },
        { 
            input: ["abc", ""], 
            expected: 0, 
            description: 'Correctly handles empty search string', 
            points: 10 
        },
        { 
            input: ["", "abc"], 
            expected: -1, 
            description: 'Correctly handles empty main string', 
            points: 10 
        },
        { 
            input: ["banana", "ana"], 
            expected: 1, 
            description: 'Correctly finds first occurrence when multiple matches exist', 
            points: 10 
        }
    ]

    // Run all test cases with a generic runner
    testCases.forEach(testCase => {
        // If function exists, run the actual test, otherwise return false
        const testResult = functionExists 
            ? runFunction('myIndexOf', testCase.input)
            : { success: false, returnValue: null }
        
        checkAndRecord(testCase.description, () => {
            if (!functionExists || !testResult.success) return false
            
            // Check that returnValue has the expected type before operating on it
            if (!checkReturnValueType(testResult.returnValue, 'number')) return false
            
            return testResult.returnValue === testCase.expected
        }, testCase.points)
    })

    return { 
        ...getResults(), 
        success: result.success, 
        error: result.error, 
        studentCode: originalCode 
    }
} 