import { runScript, runFunction } from '../services/code-runner.service.js'
import { hasFunctionWithSignature } from '../services/type-checker.service.js'
import { createTestCollector } from '../services/test-collector.service.js'
import { stripComments } from '../services/file-utils.service.js'

export function test(studentFilePath) {
    let studentCode = stripComments(studentFilePath)
    if (!studentCode) return { submitted: false }

    let { checkAndRecord, getResults, executionFailed } = createTestCollector()

    // Test that the script runs without errors
    const result = runScript(studentCode)
    checkAndRecord('Code executes successfully', result.success, 10)

    if (!result.success) return executionFailed(result, studentCode)

    // Check that mySplit function exists with 2 parameters
    const functionExists = hasFunctionWithSignature('mySplit', 2)
    checkAndRecord('Function mySplit is defined correctly with 2 parameters', () => {
        return functionExists
    }, 20)

    // Define test cases for single character separators
    const testCases = [
        { 
            input: ['Japan,Russia,Sweden', ','], 
            expected: ['Japan', 'Russia', 'Sweden'],
            description: 'Example from exercise (comma separator)'
        },
        { 
            input: ['1-800-652-0198', '-'], 
            expected: ['1', '800', '652', '0198'],
            description: 'Example from exercise (dash separator)'
        },
        { 
            input: ['a b c d', ' '], 
            expected: ['a', 'b', 'c', 'd'],
            description: 'Space separator'
        },
        { 
            input: ['no-separator-here', 'x'], 
            expected: ['no-separator-here'],
            description: 'No separator in string'
        },
        {
            input: ['', ','], 
            expected: [''],
            description: 'Empty string'
        },
        {
            input: ['start,middle,end,', ','], 
            expected: ['start', 'middle', 'end', ''],
            description: 'Separator at end'
        },
        {
            input: [',start,middle,end', ','], 
            expected: ['', 'start', 'middle', 'end'],
            description: 'Separator at beginning'
        }
    ]

    // Run test cases
    testCases.forEach(testCase => {
        const testResult = functionExists 
            ? runFunction('mySplit', testCase.input) 
            : { success: false, returnValue: null }
        
        checkAndRecord(`mySplit handles "${testCase.description}" correctly`, () => {
            if (!functionExists || !testResult.success) return false
            
            if (!Array.isArray(testResult.returnValue)) return false

            const expected = JSON.stringify(testCase.expected)
            const actual = JSON.stringify(testResult.returnValue)
            
            return expected === actual
        }, 10)
    })

    // Check that built-in split is not used
    checkAndRecord('Does not use built-in split method', () => {
        return !studentCode.includes('.split(')
    }, 10)
    
    return { 
        ...getResults(), 
        success: result.success, 
        error: result.error, 
        weight: 1, 
        studentCode 
    }
} 