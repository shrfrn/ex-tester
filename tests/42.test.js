// Problem writing a test because the exercise requires 
// factoring and the original solution cannot be expected to remain

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
    const startsWithSExists = hasFunctionWithSignature('startsWithS', 1)
    const startsWithLetterExists = hasFunctionWithSignature('startsWithLetter', 2)

    checkAndRecord('Function startsWithS is defined correctly with 1 parameter', startsWithSExists, 10)
    checkAndRecord('Function startsWithLetter is defined correctly with 2 parameters', startsWithLetterExists, 10)

    // Define test cases for startsWithS
    const startsWithSTests = [
        { 
            input: ['Super'], 
            expected: true, 
            description: "startsWithS('Super') returns true", 
            points: 10 
        },
        { 
            input: ['super'], 
            expected: true, 
            description: "startsWithS('super') returns true (case insensitive)", 
            points: 10 
        },
        { 
            input: ['Hello'], 
            expected: false, 
            description: "startsWithS('Hello') returns false", 
            points: 10 
        },
        { 
            input: ['string'], 
            expected: true, 
            description: "startsWithS('string') returns true", 
            points: 10 
        },
        { 
            input: ['S'], 
            expected: true, 
            description: "startsWithS('S') returns true (single character)", 
            points: 10 
        },
        { 
            input: [''], 
            expected: false, 
            description: "startsWithS('') returns false (empty string)", 
            points: 10 
        }
    ]

    // Run all startsWithS tests
    startsWithSTests.forEach(testCase => {
        const testResult = startsWithSExists 
            ? runFunction('startsWithS', testCase.input)
            : { success: false, returnValue: null }
        
        checkAndRecord(testCase.description, () => {
            return startsWithSExists && 
                   testResult.success && 
                   testResult.returnValue === testCase.expected
        }, testCase.points)
    })

    // Define test cases for startsWithLetter
    const startsWithLetterTests = [
        { 
            input: ['Bravo', 'b'], 
            expected: true, 
            description: "startsWithLetter('Bravo', 'b') returns true (case insensitive)", 
            points: 10 
        },
        { 
            input: ['charlie', 'C'], 
            expected: true, 
            description: "startsWithLetter('charlie', 'C') returns true (case insensitive)", 
            points: 10 
        },
        { 
            input: ['Delta', 'd'], 
            expected: true, 
            description: "startsWithLetter('Delta', 'd') returns true", 
            points: 10 
        },
        { 
            input: ['Echo', 'f'], 
            expected: false, 
            description: "startsWithLetter('Echo', 'f') returns false", 
            points: 10 
        },
        { 
            input: ['Super', 's'], 
            expected: true, 
            description: "startsWithLetter('Super', 's') returns true (works like startsWithS)", 
            points: 10 
        },
        { 
            input: ['', 'a'], 
            expected: false, 
            description: "startsWithLetter('', 'a') returns false (empty string)", 
            points: 10 
        },
        { 
            input: ['Test', ''], 
            expected: false, 
            description: "startsWithLetter('Test', '') returns false (empty letter)", 
            points: 10 
        }
    ]

    // Run all startsWithLetter tests
    startsWithLetterTests.forEach(testCase => {
        const testResult = startsWithLetterExists 
            ? runFunction('startsWithLetter', testCase.input)
            : { success: false, returnValue: null }
        
        checkAndRecord(testCase.description, () => {
            return startsWithLetterExists && 
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