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
            return functionExists && 
                   testResult.success && 
                   testResult.returnValue === testCase.expected
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