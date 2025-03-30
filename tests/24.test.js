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

    // Check that myAbs function exists with 1 parameter
    const functionExists = hasFunctionWithSignature('myAbs', 1)
    checkAndRecord('Function myAbs is defined correctly with 1 parameter', () => {
        return functionExists
    }, 20)

    // Check that Math.abs is not used
    checkAndRecord('Does not use Math.abs', () => {
        return !studentCode.includes('Math.abs')
    }, 10)
    
    // Check if conditional logic is used (if statement or ternary operator)
    checkAndRecord('Uses conditional logic (if statement or ternary operator)', () => {
        const conditionalPattern = /if\s*\(|[^=!><][\?].*:.*/
        return conditionalPattern.test(studentCode)
    }, 10)

    // Define test cases from the exercise
    const testCases = [
        { input: 10, expected: 10, description: 'Positive integer' },
        { input: -10, expected: 10, description: 'Negative integer' },
        { input: 0, expected: 0, description: 'Zero' },
        { input: 3.14, expected: 3.14, description: 'Positive decimal' },
        { input: -3.14, expected: 3.14, description: 'Negative decimal' },
        { input: -0, expected: 0, description: 'Negative zero' },
        { input: Number.MAX_SAFE_INTEGER, expected: Number.MAX_SAFE_INTEGER, description: 'Maximum safe integer' },
        { input: -Number.MAX_SAFE_INTEGER, expected: Number.MAX_SAFE_INTEGER, description: 'Negative maximum safe integer' }
    ]

    // Run all test cases with a generic runner
    testCases.forEach(testCase => {
        // If function exists, run the actual test, otherwise return false
        const testResult = functionExists 
            ? runFunction('myAbs', [testCase.input])
            : { success: false, returnValue: null }
        
        checkAndRecord(`Correct calculation for ${testCase.description}: |${testCase.input}| = ${testCase.expected}`, () => {
            if (!functionExists || !testResult.success) return false
            
            // Check that returnValue has the expected type before operating on it
            if (!checkReturnValueType(testResult.returnValue, 'number')) return false
            
            return testResult.returnValue === testCase.expected
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