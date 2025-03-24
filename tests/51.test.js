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

    // Check that countWordApperances function exists with 1 parameter
    const functionExists = hasFunctionWithSignature('countWordApperances', 1)
    checkAndRecord('Function countWordApperances is defined correctly with 1 parameter', () => {
        return functionExists
    }, 20)

    // Define test cases
    const testCases = [
        { 
            input: ['puki ben david and muki ben david'], 
            expected: {
                puki: 1,
                ben: 2,
                david: 2,
                and: 1,
                muki: 1
            },
            description: 'Example from exercise'
        },
        { 
            input: ['hello hello hello'], 
            expected: {
                hello: 3
            },
            description: 'Single word repeated'
        },
        { 
            input: ['one two three'], 
            expected: {
                one: 1,
                two: 1,
                three: 1
            },
            description: 'All words appear once'
        },
        { 
            input: [''], 
            expected: {},
            description: 'Empty string'
        },
        {
            input: ['word'], 
            expected: {
                word: 1
            },
            description: 'Single word'
        }
    ]

    // Run test cases
    testCases.forEach(testCase => {
        const testResult = functionExists 
            ? runFunction('countWordApperances', testCase.input) 
            : { success: false, returnValue: null }
        
        checkAndRecord(`countWordApperances handles "${testCase.description}" correctly`, () => {
            if (!functionExists || !testResult.success) return false
            
            if (typeof testResult.returnValue !== 'object' || testResult.returnValue === null) return false

            const expected = JSON.stringify(testCase.expected)
            const actual = JSON.stringify(testResult.returnValue)
            
            return expected === actual
        }, 10)
    })

    // Check that split is used
    checkAndRecord('Uses split to separate words', () => {
        return studentCode.includes('.split(')
    }, 10)
    
    return { 
        ...getResults(), 
        success: result.success, 
        error: result.error, 
        weight: 1, 
        studentCode 
    }
} 